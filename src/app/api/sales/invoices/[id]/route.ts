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

    const invoice = await prisma.salesInvoice.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        customer: {
          select: { id: true, name: true, bpNumber: true, email: true, phone: true, address: true, city: true },
        },
        currency: { select: { id: true, code: true, symbol: true } },
        exchangeRate: { select: { id: true, rate: true, parallelMarketRate: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
            currency: { select: { code: true, symbol: true } },
          },
        },
        payments: {
          include: {
            currency: { select: { code: true, symbol: true } },
            createdBy: { select: { name: true } },
          },
          orderBy: { receivedAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      vatAmount: Number(invoice.vatAmount),
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      balanceDue: Number(invoice.balanceDue),
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
      payments: invoice.payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
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

    const existing = await prisma.salesInvoice.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existing.status === "PAID" || existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Cannot update a ${existing.status.toLowerCase()} invoice` },
        { status: 400 }
      );
    }

    const invoice = await prisma.salesInvoice.update({
      where: { id },
      data: {
        customerId: body.customerId ?? undefined,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        currencyId: body.currencyId ?? undefined,
        exchangeRateId: body.exchangeRateId !== undefined ? body.exchangeRateId : undefined,
      },
      include: {
        customer: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
      },
    });

    return NextResponse.json({
      ...invoice,
      subtotal: Number(invoice.subtotal),
      vatAmount: Number(invoice.vatAmount),
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
      balanceDue: Number(invoice.balanceDue),
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
