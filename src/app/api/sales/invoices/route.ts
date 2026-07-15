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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { tenantId: user.tenantId };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const invoices = await prisma.salesInvoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
        items: {
          include: {
            item: { select: { id: true, name: true } },
          },
        },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    const serialized = invoices.map((inv) => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      vatAmount: Number(inv.vatAmount),
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid),
      balanceDue: Number(inv.balanceDue),
      items: inv.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching invoices:", error);
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

    if (!body.customerId) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await prisma.salesInvoice.count({
      where: {
        tenantId: user.tenantId,
        invoiceNumber: { startsWith: `INV-${year}-` },
      },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

    // Calculate totals
    let subtotal = 0;
    let totalVat = 0;

    const lineItems = body.items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const vatRate = Number(item.vatRate) || (body.vatRate ?? 15);
      const lineTotal = qty * price;
      const vatAmount = lineTotal * (vatRate / 100);

      subtotal += lineTotal;
      totalVat += vatAmount;

      return {
        description: item.description || "",
        itemId: item.itemId || null,
        quantity: qty,
        unitPrice: price,
        vatRate,
        lineTotal,
        currencyId: body.currencyId,
        exchangeRateId: body.exchangeRateId || null,
      };
    });

    const total = subtotal + totalVat;
    const vatRate = body.vatRate ?? 15;

    // Create invoice with items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.create({
        data: {
          tenantId: user.tenantId,
          invoiceNumber,
          customerId: body.customerId,
          issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
          dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "DRAFT",
          currencyId: body.currencyId,
          exchangeRateId: body.exchangeRateId || null,
          subtotal,
          vatAmount: totalVat,
          vatRate,
          total,
          amountPaid: 0,
          balanceDue: total,
          notes: body.notes || null,
          paymentMethod: body.paymentMethod || null,
          createdById: user.id,
          items: {
            create: lineItems,
          },
        },
        include: {
          customer: { select: { id: true, name: true } },
          currency: { select: { code: true, symbol: true } },
          items: {
            include: {
              item: { select: { id: true, name: true } },
            },
          },
        },
      });

      return inv;
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
