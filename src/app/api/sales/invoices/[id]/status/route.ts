import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

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

    const validTransitions: Record<string, string[]> = {
      DRAFT: ["FISCAL", "CANCELLED"],
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

    // When marking as PAID, set amountPaid = total
    const updateData: any = { status };
    if (status === "PAID") {
      updateData.amountPaid = Number(invoice.total);
      updateData.balanceDue = 0;
    }

    const updated = await prisma.salesInvoice.update({
      where: { id },
      data: updateData,
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
