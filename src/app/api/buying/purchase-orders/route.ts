import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { nextSequenceNumber } from "@/lib/sequence";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { tenantId: user.tenantId };

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    const serialized = orders.map((po) => ({
      ...po,
      subtotal: Number(po.subtotal),
      vatAmount: Number(po.vatAmount),
      total: Number(po.total),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching POs:", error);
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

    if (!body.supplierId) {
      return NextResponse.json({ error: "Supplier is required" }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }

    const year = new Date().getFullYear();

    // Calculate totals
    let subtotal = 0;
    const lineItems = body.items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const lineTotal = qty * price;
      subtotal += lineTotal;
      return {
        description: item.description || "",
        itemId: item.itemId || null,
        quantity: qty,
        unitPrice: price,
        lineTotal,
        currencyId: body.currencyId,
        exchangeRateId: body.exchangeRateId || null,
      };
    });

    const total = subtotal;

    const order = await prisma.$transaction(async (tx) => {
      const seq = await nextSequenceNumber(tx, user.tenantId, "po", year);
      const poNumber = `PO-${year}-${String(seq).padStart(4, "0")}`;

      const po = await tx.purchaseOrder.create({
        data: {
          tenantId: user.tenantId,
          poNumber,
          supplierId: body.supplierId,
          orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
          expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
          status: "DRAFT",
          currencyId: body.currencyId,
          exchangeRateId: body.exchangeRateId || null,
          subtotal,
          vatAmount: 0,
          total,
          notes: body.notes || null,
          createdById: user.id,
          items: { create: lineItems },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          currency: { select: { code: true, symbol: true } },
          items: true,
        },
      });
      return po;
    });

    return NextResponse.json(
      {
        ...order,
        subtotal: Number(order.subtotal),
        vatAmount: Number(order.vatAmount),
        total: Number(order.total),
        items: order.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating PO:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
