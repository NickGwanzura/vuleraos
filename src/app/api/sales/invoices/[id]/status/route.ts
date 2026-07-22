import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { reverseInvoicePostings, reversePaymentPostings } from "@/lib/ledger/postings";

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
    const { status } = body;

    // DRAFT -> FISCAL is deliberately not offered here: fiscalising must go
    // through PUT .../fiscalise, which validates ZIMRA compliance, generates
    // the fiscal receipt number, and posts the journal entry.
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["CANCELLED"],
      FISCAL: ["PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"],
      PARTIALLY_PAID: ["PAID", "OVERDUE", "CANCELLED"],
      OVERDUE: ["PAID", "PARTIALLY_PAID", "CANCELLED"],
    };

    const invoice = await prisma.salesInvoice.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!validTransitions[invoice.status]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${invoice.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    if (status === "PAID") {
      return NextResponse.json(
        {
          error: "An invoice can only be marked PAID by recording a payment against it.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.salesInvoice.update({
        where: { id },
        data: { status },
      });

      if (status === "CANCELLED") {
        await reverseInvoicePostings(tx, {
          tenantId: user.tenantId,
          invoiceId: id,
          postedById: user.id,
        });
        const payments = await tx.payment.findMany({ where: { invoiceId: id } });
        for (const payment of payments) {
          await reversePaymentPostings(tx, {
            tenantId: user.tenantId,
            paymentId: payment.id,
            postedById: user.id,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "status_change",
          entityType: "sales_invoice",
          entityId: id,
          changes: { status, previousStatus: invoice.status },
        },
      });

      return updated;
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      amountPaid: Number(updated.amountPaid),
      balanceDue: Number(updated.balanceDue),
    });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
