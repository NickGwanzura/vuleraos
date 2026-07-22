import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { postPaymentReceived } from "@/lib/ledger/postings";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const method = searchParams.get("method");
    const reconciled = searchParams.get("reconciled");
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { tenantId: user.tenantId };

    if (method && method !== "all") {
      where.paymentMethod = method;
    }

    if (reconciled === "true") where.isReconciled = true;
    if (reconciled === "false") where.isReconciled = false;

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { invoice: { invoiceNumber: { contains: search, mode: "insensitive" } } },
        { invoice: { customer: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, customer: { select: { name: true } } },
        },
        currency: { select: { code: true, symbol: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { receivedAt: "desc" },
      take: Math.min(limit, 200),
    });

    const serialized = payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching payments:", error);
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

    if (!body.invoiceId || !body.amount || !body.paymentMethod) {
      return NextResponse.json(
        { error: "invoiceId, amount, and paymentMethod are required" },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const validMethods = ["ECOCASH", "ONEMONEY", "RTGS", "BANK_TRANSFER", "CASH", "OTHER"];
    if (!validMethods.includes(body.paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verify invoice exists and belongs to tenant
      const invoice = await tx.salesInvoice.findFirst({
        where: { id: body.invoiceId, tenantId: user.tenantId },
      });

      if (!invoice) throw new Error("Invoice not found");

      const currentPaid = Number(invoice.amountPaid);
      const newPaid = currentPaid + amount;
      const balanceDue = Number(invoice.total) - newPaid;

      // Create payment
      const payment = await tx.payment.create({
        data: {
          tenantId: user.tenantId,
          invoiceId: body.invoiceId,
          amount,
          currencyId: body.currencyId || invoice.currencyId,
          exchangeRateId: body.exchangeRateId || null,
          paymentMethod: body.paymentMethod,
          referenceNumber: body.referenceNumber || null,
          bankName: body.bankName || null,
          matchedInvoiceId: body.invoiceId,
          isReconciled: body.isReconciled ?? true,
          receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
          notes: body.notes || null,
          createdById: user.id,
        },
      });

      // Update invoice payment status
      let invoiceStatus = invoice.status;
      if (balanceDue <= 0) {
        invoiceStatus = "PAID";
      } else if (newPaid > 0) {
        invoiceStatus = "PARTIALLY_PAID";
      }

      await tx.salesInvoice.update({
        where: { id: body.invoiceId },
        data: {
          amountPaid: newPaid,
          balanceDue: Math.max(0, balanceDue),
          status: invoiceStatus,
        },
      });

      await postPaymentReceived(
        tx,
        { ...payment, invoice: { customerId: invoice.customerId } },
        user.id
      );

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error recording payment:", error);
    const message = error.message || "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: message === "Invoice not found" ? 404 : 500 }
    );
  }
}
