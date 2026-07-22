import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { postJournalEntry } from "@/lib/ledger";
import { getAccount, ACCOUNT_CODES } from "@/lib/ledger/accounts";

const CLOSER_ROLES = ["OWNER", "ACCOUNTANT"];

/**
 * Close a fiscal year: zero every INCOME/EXPENSE account's balance for that
 * calendar year into Retained Earnings, then lock the period through
 * December 31. Necessary because the Balance Sheet sums all posted lines
 * from the beginning of time for ASSET/LIABILITY/EQUITY accounts — without
 * this, Retained Earnings would stay zero regardless of how many years of
 * profit the business has posted, and the Trial Balance's income/expense
 * rows would keep accumulating indefinitely across years instead of
 * resetting each period.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!CLOSER_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: "Only an owner or accountant can close a fiscal year." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const year = Number(body.year);
    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "A valid year is required" }, { status: 400 });
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const existing = await prisma.journalEntry.findFirst({
      where: { tenantId: user.tenantId, sourceType: "year_close", sourceId: String(year) },
    });
    if (existing) {
      return NextResponse.json({ error: `${year} has already been closed.` }, { status: 400 });
    }

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: {
          tenantId: user.tenantId,
          status: "POSTED",
          entryDate: { gte: yearStart, lte: yearEnd },
        },
        account: { type: { in: ["INCOME", "EXPENSE"] } },
      },
      include: { account: { select: { id: true, type: true } } },
    });

    if (lines.length === 0) {
      return NextResponse.json(
        { error: `No income or expense postings found for ${year}.` },
        { status: 400 }
      );
    }

    const byAccount = new Map<string, { accountId: string; type: string; currencyId: string; debit: number; credit: number }>();
    for (const line of lines) {
      const key = `${line.accountId}:${line.currencyId}`;
      const bucket = byAccount.get(key) ?? {
        accountId: line.accountId,
        type: line.account.type,
        currencyId: line.currencyId,
        debit: 0,
        credit: 0,
      };
      bucket.debit += Number(line.debit);
      bucket.credit += Number(line.credit);
      byAccount.set(key, bucket);
    }

    const netIncomeByCurrency = new Map<string, number>();
    const closingLines: {
      accountId: string;
      direction: "debit" | "credit";
      amount: number;
      currencyId: string;
    }[] = [];

    for (const bucket of byAccount.values()) {
      const isIncome = bucket.type === "INCOME";
      const balance = isIncome ? bucket.credit - bucket.debit : bucket.debit - bucket.credit;
      if (Math.abs(balance) < 0.005) continue;

      // Zero the account: reverse its normal balance direction.
      closingLines.push({
        accountId: bucket.accountId,
        direction: isIncome ? "debit" : "credit",
        amount: Math.abs(balance),
        currencyId: bucket.currencyId,
      });

      const net = netIncomeByCurrency.get(bucket.currencyId) ?? 0;
      netIncomeByCurrency.set(bucket.currencyId, net + (isIncome ? balance : -balance));
    }

    const result = await prisma.$transaction(async (tx) => {
      const retainedEarnings = await getAccount(tx, user.tenantId, ACCOUNT_CODES.RETAINED_EARNINGS);

      for (const [currencyId, netIncome] of netIncomeByCurrency) {
        if (Math.abs(netIncome) < 0.005) continue;
        closingLines.push({
          accountId: retainedEarnings.id,
          direction: netIncome >= 0 ? "credit" : "debit",
          amount: Math.abs(netIncome),
          currencyId,
        });
      }

      const entry = await postJournalEntry(tx, {
        tenantId: user.tenantId,
        entryDate: yearEnd,
        memo: `Close fiscal year ${year}`,
        sourceType: "year_close",
        sourceId: String(year),
        postedById: user.id,
        lines: closingLines,
      });

      await tx.tenant.update({
        where: { id: user.tenantId },
        data: { periodLockDate: yearEnd },
      });

      return entry;
    });

    return NextResponse.json({
      entryNumber: result.entryNumber,
      netIncomeByCurrency: Object.fromEntries(netIncomeByCurrency),
      lockedThrough: yearEnd.toISOString(),
    });
  } catch (error: any) {
    console.error("Error closing fiscal year:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
