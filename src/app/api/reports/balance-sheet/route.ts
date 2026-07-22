import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

// Accounts with a normal debit balance report as debit-credit; accounts
// with a normal credit balance (liabilities, equity) report as credit-debit.
const CREDIT_NORMAL = new Set(["LIABILITY", "EQUITY"]);

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const asOf = searchParams.get("asOf")
      ? new Date(searchParams.get("asOf")!)
      : new Date();

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: {
          tenantId: user.tenantId,
          status: "POSTED",
          entryDate: { lte: asOf },
        },
        account: { type: { in: ["ASSET", "LIABILITY", "EQUITY"] } },
      },
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
        currency: { select: { code: true } },
      },
    });

    const rows = new Map<
      string,
      { accountId: string; code: string; name: string; type: string; currencyCode: string; balance: number }
    >();

    for (const line of lines) {
      const key = `${line.accountId}:${line.currency.code}`;
      const signedAmount = CREDIT_NORMAL.has(line.account.type)
        ? Number(line.credit) - Number(line.debit)
        : Number(line.debit) - Number(line.credit);

      const existing = rows.get(key);
      if (existing) {
        existing.balance += signedAmount;
      } else {
        rows.set(key, {
          accountId: line.account.id,
          code: line.account.code,
          name: line.account.name,
          type: line.account.type,
          currencyCode: line.currency.code,
          balance: signedAmount,
        });
      }
    }

    const all = Array.from(rows.values()).sort((a, b) => a.code.localeCompare(b.code));
    const assets = all.filter((r) => r.type === "ASSET");
    const liabilities = all.filter((r) => r.type === "LIABILITY");
    const equity = all.filter((r) => r.type === "EQUITY");

    const sum = (rows: typeof all) => rows.reduce((s, r) => s + r.balance, 0);

    return NextResponse.json({
      asOf: asOf.toISOString(),
      assets,
      liabilities,
      equity,
      totals: {
        assets: sum(assets),
        liabilities: sum(liabilities),
        equity: sum(equity),
      },
    });
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
