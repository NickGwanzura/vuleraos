import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        supplier: { select: { id: true, name: true, bpNumber: true, email: true, phone: true } },
        currency: { select: { id: true, code: true, symbol: true } },
        exchangeRate: { select: { id: true, rate: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...po,
      subtotal: Number(po.subtotal),
      vatAmount: Number(po.vatAmount),
      total: Number(po.total),
      items: po.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        quantityReceived: Number(item.quantityReceived),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
    });
  } catch (error) {
    console.error("Error fetching PO:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: body.supplierId ?? undefined,
        orderDate: body.orderDate ? new Date(body.orderDate) : undefined,
        expectedDate: body.expectedDate !== undefined ? (body.expectedDate ? new Date(body.expectedDate) : null) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json({
      ...po,
      subtotal: Number(po.subtotal),
      vatAmount: Number(po.vatAmount),
      total: Number(po.total),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
