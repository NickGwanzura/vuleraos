import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, paymentMethod, transactionId, senderPhone, notes } = body;

    if (!invoiceId || !amount || !paymentMethod || !transactionId) {
      return NextResponse.json(
        { error: "invoiceId, amount, paymentMethod, and transactionId are required" },
        { status: 400 }
      );
    }

    if (!["ECOCASH", "ONEMONEY"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "paymentMethod must be ECOCASH or ONEMONEY" },
        { status: 400 }
      );
    }

    const amt = Number(amount);
    if (amt <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.findFirst({
        where: { id: invoiceId, tenantId: user.tenantId },
      });

      if (!invoice) throw new Error("Invoice not found");

      const currentPaid = Number(invoice.amountPaid);
      const newPaid = currentPaid + amt;
      const balanceDue = Number(invoice.total) - newPaid;

      const payment = await tx.payment.create({
        data: {
          tenantId: user.tenantId,
          invoiceId,
          amount: amt,
          currencyId: invoice.currencyId,
          paymentMethod,
          referenceNumber: transactionId,
          matchedInvoiceId: invoiceId,
          isReconciled: true,
          notes: senderPhone ? `Mobile payment from ${senderPhone}` : notes || null,
          createdById: user.id,
        },
      });

      let invoiceStatus = invoice.status;
      if (balanceDue <= 0) {
        invoiceStatus = "PAID";
      } else if (newPaid > 0) {
        invoiceStatus = "PARTIALLY_PAID";
      }

      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newPaid,
          balanceDue: Math.max(0, balanceDue),
          status: invoiceStatus,
          transactionRef: transactionId,
          paymentMethod,
        },
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error recording mobile payment:", error);
    const message = error.message || "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: message === "Invoice not found" ? 404 : 500 }
    );
  }
}
