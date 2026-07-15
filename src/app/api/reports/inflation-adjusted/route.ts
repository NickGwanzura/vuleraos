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
    const months = parseInt(searchParams.get("months") || "12");

    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);

    // Get latest exchange rate (USD→ZWG)
    const currencies = await prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    });
    const usd = currencies.find((c) => c.code === "USD");
    const zwg = currencies.find((c) => c.code === "ZWG");

    let currentRate: number | null = null;
    if (usd && zwg) {
      const latest = await prisma.exchangeRate.findFirst({
        where: { tenantId: user.tenantId, fromCurrencyId: usd.id, toCurrencyId: zwg.id },
        orderBy: { effectiveDate: "desc" },
      });
      if (latest) currentRate = Number(latest.rate);
    }

    // Get sales invoices in period
    const invoices = await prisma.salesInvoice.findMany({
      where: {
        tenantId: user.tenantId,
        issueDate: { gte: fromDate },
        status: { not: "CANCELLED" },
      },
      select: { total: true, issueDate: true, currencyId: true },
      orderBy: { issueDate: "asc" },
    });

    // Get stock items for valuation
    const items = await prisma.item.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: {
        name: true, currentStock: true, defaultPrice: true, costPrice: true,
        valuationMethod: true, updatedAt: true,
      },
    });

    // Build monthly revenue data with rate lookup
    const monthlyData: Record<string, { revenue: number; count: number; rate: number | null }> = {};

    for (const inv of invoices) {
      const monthKey = inv.issueDate.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, count: 0, rate: null };

      monthlyData[monthKey].revenue += Number(inv.total);
      monthlyData[monthKey].count += 1;

      // Find rate closest to this invoice date
      if (usd && zwg && !monthlyData[monthKey].rate) {
        const rateAtTime = await prisma.exchangeRate.findFirst({
          where: {
            tenantId: user.tenantId,
            fromCurrencyId: usd.id,
            toCurrencyId: zwg.id,
            effectiveDate: { lte: inv.issueDate },
          },
          orderBy: { effectiveDate: "desc" },
        });
        if (rateAtTime) monthlyData[monthKey].rate = Number(rateAtTime.rate);
      }
    }

    // Build monthly summary
    const monthsData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        let adjustedRevenue = data.revenue;
        let adjustmentPercent = 0;
        if (data.rate && currentRate) {
          adjustedRevenue = data.revenue * (currentRate / data.rate);
          adjustmentPercent = Math.round(((adjustedRevenue - data.revenue) / data.revenue) * 10000) / 100;
        }
        return {
          month,
          revenue: data.revenue,
          adjustedRevenue: Math.round(adjustedRevenue * 100) / 100,
          adjustmentPercent,
          count: data.count,
          rate: data.rate,
        };
      });

    // Stock valuation summary
    const stockValuation = items.map((item) => {
      const stock = Number(item.currentStock);
      const price = Number(item.costPrice || item.defaultPrice || 0);
      return {
        name: item.name,
        stock,
        unitValue: price,
        totalValue: stock * price,
      };
    });

    return NextResponse.json({
      period: { months, from: fromDate.toISOString() },
      currentRate,
      months: monthsData,
      totals: {
        unadjustedRevenue: monthsData.reduce((s, m) => s + m.revenue, 0),
        adjustedRevenue: monthsData.reduce((s, m) => s + m.adjustedRevenue, 0),
      },
      stockValuation: {
        items: stockValuation,
        total: stockValuation.reduce((s, i) => s + i.totalValue, 0),
      },
    });
  } catch (error) {
    console.error("Error generating inflation report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
