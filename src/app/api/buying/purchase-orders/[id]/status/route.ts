import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { reversePOPostings } from "@/lib/ledger/postings";

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
      DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
      PENDING_APPROVAL: ["APPROVED", "DRAFT", "CANCELLED"],
      APPROVED: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
      PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
    };

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { items: true },
    });
    if (!po) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!validTransitions[po.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${po.status} to ${status}` },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    // If approving, record who approved
    if (status === "APPROVED") {
      updateData.approvedById = user.id;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
      });

      if (status === "CANCELLED") {
        // Reverse any stock already received against this PO — otherwise a
        // cancelled PO leaves stock quantities incremented forever.
        for (const item of po.items) {
          const qtyReceived = Number(item.quantityReceived);
          if (qtyReceived <= 0 || !item.itemId) continue;

          await tx.stockTransaction.create({
            data: {
              tenantId: user.tenantId,
              itemId: item.itemId,
              type: "OUT",
              quantity: qtyReceived,
              unitCost: Number(item.unitPrice),
              currencyId: item.currencyId,
              exchangeRateId: item.exchangeRateId,
              referenceType: "purchase_order_cancellation",
              referenceId: id,
              notes: `Reversed: PO ${po.poNumber} cancelled`,
              createdById: user.id,
            },
          });

          await tx.item.update({
            where: { id: item.itemId },
            data: { currentStock: { decrement: qtyReceived } },
          });
        }

        await reversePOPostings(tx, {
          tenantId: user.tenantId,
          purchaseOrderId: id,
          postedById: user.id,
        });
      }

      return updated;
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error updating PO status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
