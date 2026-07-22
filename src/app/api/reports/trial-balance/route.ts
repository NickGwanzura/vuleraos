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
      },
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
        currency: { select: { code: true, symbol: true } },
      },
    });

    const rows = new Map<
      string,
      {
        accountId: string;
        code: string;
        name: string;
        type: string;
        currencyCode: string;
        debit: number;
        credit: number;
      }
    >();

    for (const line of lines) {
      const key = `${line.accountId}:${line.currency.code}`;
      const existing = rows.get(key);
      if (existing) {
        existing.debit += Number(line.debit);
        existing.credit += Number(line.credit);
      } else {
        rows.set(key, {
          accountId: line.account.id,
          code: line.account.code,
          name: line.account.name,
          type: line.account.type,
          currencyCode: line.currency.code,
          debit: Number(line.debit),
          credit: Number(line.credit),
        });
      }
    }

    const result = Array.from(rows.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );

    const totals = result.reduce(
      (acc, row) => ({
        debit: acc.debit + row.debit,
        credit: acc.credit + row.credit,
      }),
      { debit: 0, credit: 0 }
    );

    return NextResponse.json({ asOf: asOf.toISOString(), rows: result, totals });
  } catch (error) {
    console.error("Error generating trial balance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
