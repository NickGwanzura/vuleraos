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

    const payment = await prisma.payment.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        isReconciled: body.isReconciled !== undefined ? body.isReconciled : undefined,
        matchedInvoiceId: body.matchedInvoiceId !== undefined ? body.matchedInvoiceId : undefined,
        referenceNumber: body.referenceNumber !== undefined ? body.referenceNumber : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
