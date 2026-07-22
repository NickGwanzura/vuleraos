import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

/**
 * Converts a foreign-currency amount to the tenant's base currency using a
 * specific historical (or current) exchange rate row. Direction-agnostic:
 * ExchangeRate rows can be recorded either way (foreign->base or
 * base->foreign), so this checks which and applies the correct operation
 * rather than assuming a fixed convention.
 */
function convertToBase(
  amount: number,
  rate: { rate: number; fromCurrencyId: string; toCurrencyId: string },
  foreignCurrencyId: string,
  baseCurrencyId: string
): number {
  if (rate.fromCurrencyId === foreignCurrencyId && rate.toCurrencyId === baseCurrencyId) {
    return amount * rate.rate;
  }
  if (rate.fromCurrencyId === baseCurrencyId && rate.toCurrencyId === foreignCurrencyId) {
    return amount / rate.rate;
  }
  throw new Error("Exchange rate does not relate these two currencies.");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseCurrency = await prisma.currency.findFirst({
      where: { tenantId: user.tenantId, isBase: true },
    });
    if (!baseCurrency) {
      return NextResponse.json({ error: "No base currency configured" }, { status: 400 });
    }

    const lines = await prisma.journalLine.findMany({
      where: {
        journalEntry: { tenantId: user.tenantId, status: "POSTED" },
        account: { type: { in: ["ASSET", "LIABILITY"] } },
        currencyId: { not: baseCurrency.id },
      },
      include: {
        account: { select: { id: true, code: true, name: true, type: true } },
        currency: { select: { code: true } },
        exchangeRate: { select: { rate: true, fromCurrencyId: true, toCurrencyId: true } },
      },
    });

    if (lines.length === 0) {
      return NextResponse.json({ baseCurrency: baseCurrency.code, rows: [] });
    }

    const byAccount = new Map<
      string,
      {
        accountId: string;
        code: string;
        name: string;
        type: string;
        currencyId: string;
        currencyCode: string;
        debit: number;
        credit: number;
        weightedRateSum: number;
        weightSum: number;
        linesMissingRate: number;
      }
    >();

    for (const line of lines) {
      const key = `${line.accountId}:${line.currencyId}`;
      const bucket = byAccount.get(key) ?? {
        accountId: line.account.id,
        code: line.account.code,
        name: line.account.name,
        type: line.account.type,
        currencyId: line.currencyId,
        currencyCode: line.currency.code,
        debit: 0,
        credit: 0,
        weightedRateSum: 0,
        weightSum: 0,
        linesMissingRate: 0,
      };
      bucket.debit += Number(line.debit);
      bucket.credit += Number(line.credit);
      const amount = Number(line.debit) > 0 ? Number(line.debit) : Number(line.credit);
      if (line.exchangeRate) {
        bucket.weightedRateSum += amount * Number(line.exchangeRate.rate);
        bucket.weightSum += amount;
      } else {
        bucket.linesMissingRate += 1;
      }
      byAccount.set(key, bucket);
    }

    const currentRates = await prisma.exchangeRate.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { effectiveDate: "desc" },
    });

    function latestRateFor(foreignCurrencyId: string) {
      return currentRates.find(
        (r) =>
          (r.fromCurrencyId === foreignCurrencyId && r.toCurrencyId === baseCurrency!.id) ||
          (r.fromCurrencyId === baseCurrency!.id && r.toCurrencyId === foreignCurrencyId)
      );
    }

    const rows: {
      accountId: string;
      code: string;
      name: string;
      type: string;
      currencyCode: string;
      foreignBalance: number;
      historicalRate: number;
      currentRate: number;
      baseEquivThen: number;
      baseEquivNow: number;
      unrealizedGainLoss: number;
      linesMissingRate: number;
    }[] = [];
    for (const bucket of byAccount.values()) {
      if (bucket.weightSum === 0) continue; // no rate history to translate with

      const foreignBalance = bucket.type === "ASSET" ? bucket.debit - bucket.credit : bucket.credit - bucket.debit;
      if (Math.abs(foreignBalance) < 0.005) continue;

      const historicalRateRow = { rate: bucket.weightedRateSum / bucket.weightSum, fromCurrencyId: "", toCurrencyId: "" };
      const current = latestRateFor(bucket.currencyId);
      if (!current) continue;

      // The weighted-average historical rate is a scalar, not tied to a
      // specific from/to pair, so use the current rate's direction to
      // interpret it consistently.
      const historicalUsdEquiv = convertToBase(
        foreignBalance,
        { rate: historicalRateRow.rate, fromCurrencyId: current.fromCurrencyId, toCurrencyId: current.toCurrencyId },
        bucket.currencyId,
        baseCurrency.id
      );
      const currentUsdEquiv = convertToBase(
        foreignBalance,
        { rate: Number(current.rate), fromCurrencyId: current.fromCurrencyId, toCurrencyId: current.toCurrencyId },
        bucket.currencyId,
        baseCurrency.id
      );

      rows.push({
        accountId: bucket.accountId,
        code: bucket.code,
        name: bucket.name,
        type: bucket.type,
        currencyCode: bucket.currencyCode,
        foreignBalance,
        historicalRate: historicalRateRow.rate,
        currentRate: Number(current.rate),
        baseEquivThen: historicalUsdEquiv,
        baseEquivNow: currentUsdEquiv,
        unrealizedGainLoss: currentUsdEquiv - historicalUsdEquiv,
        linesMissingRate: bucket.linesMissingRate,
      });
    }

    return NextResponse.json({ baseCurrency: baseCurrency.code, rows });
  } catch (error) {
    console.error("Error generating currency exposure report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
