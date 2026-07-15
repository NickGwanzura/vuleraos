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
    const fromCurrency = searchParams.get("from") || "USD";
    const toCurrency = searchParams.get("to") || "ZWG";
    const limit = parseInt(searchParams.get("limit") || "30");

    const currencies = await prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    });

    const fromCur = currencies.find((c) => c.code === fromCurrency);
    const toCur = currencies.find((c) => c.code === toCurrency);

    if (!fromCur || !toCur) {
      return NextResponse.json({ error: "Currency not found" }, { status: 404 });
    }

    const rates = await prisma.exchangeRate.findMany({
      where: {
        tenantId: user.tenantId,
        fromCurrencyId: fromCur.id,
        toCurrencyId: toCur.id,
      },
      include: {
        createdBy: { select: { name: true } },
      },
      orderBy: { effectiveDate: "desc" },
      take: Math.min(limit, 365),
    });

    const serialized = rates.map((r) => ({
      id: r.id,
      rate: Number(r.rate),
      parallelMarketRate: r.parallelMarketRate ? Number(r.parallelMarketRate) : null,
      effectiveDate: r.effectiveDate.toISOString(),
      isManualOverride: r.isManualOverride,
      notes: r.notes,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      fromCurrency,
      toCurrency,
      rates: serialized,
    });
  } catch (error) {
    console.error("Error fetching rates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.rate || body.rate <= 0) {
      return NextResponse.json({ error: "Valid rate is required" }, { status: 400 });
    }

    const currencies = await prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    });

    const fromCur = currencies.find(
      (c) => c.code === (body.fromCurrency || "USD")
    );
    const toCur = currencies.find(
      (c) => c.code === (body.toCurrency || "ZWG")
    );

    if (!fromCur || !toCur) {
      return NextResponse.json({ error: "Currency not found" }, { status: 404 });
    }

    const rate = await prisma.exchangeRate.create({
      data: {
        tenantId: user.tenantId,
        fromCurrencyId: fromCur.id,
        toCurrencyId: toCur.id,
        rate: Number(body.rate),
        parallelMarketRate: body.parallelMarketRate ? Number(body.parallelMarketRate) : null,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
        isManualOverride: body.isManualOverride || false,
        notes: body.notes || null,
        createdByUserId: user.id,
      },
      include: {
        createdBy: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        ...rate,
        rate: Number(rate.rate),
        parallelMarketRate: rate.parallelMarketRate ? Number(rate.parallelMarketRate) : null,
        effectiveDate: rate.effectiveDate.toISOString(),
        createdAt: rate.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating rate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
