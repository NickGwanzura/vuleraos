import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: {
          tenantId: user.tenantId,
          status: "POSTED",
          entryDate: { gte: from, lte: to },
        },
        account: { type: { in: ["INCOME", "EXPENSE"] } },
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
      // Income has a normal credit balance, expense a normal debit balance.
      const signedAmount =
        line.account.type === "INCOME"
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
    const income = all.filter((r) => r.type === "INCOME");
    const expenses = all.filter((r) => r.type === "EXPENSE");

    const sum = (rows: typeof all) => rows.reduce((s, r) => s + r.balance, 0);
    const totalIncome = sum(income);
    const totalExpenses = sum(expenses);

    return NextResponse.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      income,
      expenses,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        netIncome: totalIncome - totalExpenses,
      },
    });
  } catch (error) {
    console.error("Error generating income statement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
