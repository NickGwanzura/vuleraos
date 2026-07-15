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
    const { purchaseOrderId, items } = body;

    if (!purchaseOrderId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "purchaseOrderId and items are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Verify PO exists and belongs to tenant
      const po = await tx.purchaseOrder.findFirst({
        where: { id: purchaseOrderId, tenantId: user.tenantId },
        include: { items: true },
      });

      if (!po) {
        throw new Error("Purchase order not found");
      }

      if (po.status === "RECEIVED" || po.status === "CANCELLED") {
        throw new Error(`Cannot receive a ${po.status.toLowerCase()} purchase order`);
      }

      // Process each received item
      for (const received of items) {
        const poItem = po.items.find((i) => i.id === received.itemId);
        if (!poItem) continue;

        const qty = Number(received.quantity) || 0;
        if (qty <= 0) continue;

        const newQtyReceived = Number(poItem.quantityReceived) + qty;
        if (newQtyReceived > Number(poItem.quantity)) {
          throw new Error(
            `Cannot receive more than ordered quantity for item: ${poItem.description}`
          );
        }

        // Update PO item received quantity
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { quantityReceived: newQtyReceived },
        });

        // Create stock transaction (IN)
        await tx.stockTransaction.create({
          data: {
            tenantId: user.tenantId,
            itemId: poItem.itemId!,
            type: "IN",
            quantity: qty,
            unitCost: Number(poItem.unitPrice),
            currencyId: poItem.currencyId,
            exchangeRateId: poItem.exchangeRateId,
            referenceType: "purchase_order",
            referenceId: purchaseOrderId,
            notes: `Received against PO ${po.poNumber}`,
            createdById: user.id,
          },
        });

        // Update item stock
        await tx.item.update({
          where: { id: poItem.itemId! },
          data: { currentStock: { increment: qty } },
        });
      }

      // Determine new PO status
      const allItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId },
      });

      const allReceived = allItems.every(
        (i) => Number(i.quantityReceived) >= Number(i.quantity)
      );
      const anyReceived = allItems.some((i) => Number(i.quantityReceived) > 0);

      const newStatus = allReceived
        ? "RECEIVED"
        : anyReceived
          ? "PARTIALLY_RECEIVED"
          : po.status;

      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: newStatus },
      });

      return { status: newStatus };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error receiving PO items:", error);
    const message = error.message || "Internal server error";
    const status = message.includes("not found")
      ? 404
      : message.includes("Cannot")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
