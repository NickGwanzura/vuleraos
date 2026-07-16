import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { getCached, tenantCacheKey } from "@/lib/redis/cache";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fromCurrency = searchParams.get("from") || "USD";
    const toCurrency = searchParams.get("to") || "ZWG";

    const currencies = await prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    });

    const fromCur = currencies.find((c) => c.code === fromCurrency);
    const toCur = currencies.find((c) => c.code === toCurrency);

    if (!fromCur || !toCur) {
      return NextResponse.json({ error: "Currency not found" }, { status: 404 });
    }

    const latest = await getCached(
      tenantCacheKey(user.tenantId, "currency:latest", fromCurrency, toCurrency),
      async () => {
        const rate = await prisma.exchangeRate.findFirst({
          where: {
            tenantId: user.tenantId,
            fromCurrencyId: fromCur.id,
            toCurrencyId: toCur.id,
          },
          orderBy: { effectiveDate: "desc" },
        });
        return rate;
      },
      300 // 5 minute cache for exchange rates
    );

    if (!latest) {
      return NextResponse.json({
        fromCurrency,
        toCurrency,
        rate: null,
        parallelMarketRate: null,
        effectiveDate: null,
      });
    }

    return NextResponse.json({
      fromCurrency,
      toCurrency,
      rate: Number(latest.rate),
      parallelMarketRate: latest.parallelMarketRate ? Number(latest.parallelMarketRate) : null,
      effectiveDate: latest.effectiveDate.toISOString(),
      isManualOverride: latest.isManualOverride,
    });
  } catch (error) {
    console.error("Error fetching latest rate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
