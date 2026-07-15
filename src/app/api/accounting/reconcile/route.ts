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
    const { paymentId, invoiceId } = body;

    if (!paymentId || !invoiceId) {
      return NextResponse.json(
        { error: "paymentId and invoiceId are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verify payment
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, tenantId: user.tenantId },
      });
      if (!payment) throw new Error("Payment not found");

      // Verify invoice
      const invoice = await tx.salesInvoice.findFirst({
        where: { id: invoiceId, tenantId: user.tenantId },
      });
      if (!invoice) throw new Error("Invoice not found");

      const amount = Number(payment.amount);
      const currentPaid = Number(invoice.amountPaid);
      const newPaid = currentPaid + amount;
      const balanceDue = Number(invoice.total) - newPaid;

      // Update payment
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          isReconciled: true,
          matchedInvoiceId: invoiceId,
          invoiceId,
        },
      });

      // Update invoice
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
        },
      });

      return {
        paymentId,
        invoiceId,
        amountPaid: newPaid,
        balanceDue: Math.max(0, balanceDue),
        invoiceStatus,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error reconciling payment:", error);
    const message = error.message || "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 500 }
    );
  }
}
