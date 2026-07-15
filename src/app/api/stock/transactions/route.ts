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
    const itemId = searchParams.get("itemId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = { tenantId: user.tenantId };
    if (itemId) where.itemId = itemId;

    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        item: { select: { id: true, name: true, sku: true } },
        currency: { select: { code: true, symbol: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    const serialized = transactions.map((t) => ({
      ...t,
      quantity: Number(t.quantity),
      unitCost: t.unitCost ? Number(t.unitCost) : null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.itemId || !body.type || body.quantity === undefined) {
      return NextResponse.json(
        { error: "itemId, type, and quantity are required" },
        { status: 400 }
      );
    }

    const quantity = Number(body.quantity);
    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be positive" },
        { status: 400 }
      );
    }

    if (!["IN", "OUT", "ADJUSTMENT"].includes(body.type)) {
      return NextResponse.json(
        { error: "Type must be IN, OUT, or ADJUSTMENT" },
        { status: 400 }
      );
    }

    // Use transaction to create stock movement and update item stock
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findFirst({
        where: { id: body.itemId, tenantId: user.tenantId },
      });

      if (!item) {
        throw new Error("Item not found");
      }

      // Calculate new stock level
      let stockChange = quantity;
      if (body.type === "OUT") {
        stockChange = -quantity;
        if (Number(item.currentStock) < quantity) {
          throw new Error("Insufficient stock");
        }
      }
      if (body.type === "ADJUSTMENT") {
        // For adjustment, quantity is the absolute new value or delta?
        // We'll treat it as delta for now
        stockChange = quantity;
      }

      const newStock = Number(item.currentStock) + stockChange;

      // Update item stock
      await tx.item.update({
        where: { id: body.itemId },
        data: { currentStock: Math.max(0, newStock) },
      });

      // Create transaction record
      const transaction = await tx.stockTransaction.create({
        data: {
          tenantId: user.tenantId,
          itemId: body.itemId,
          type: body.type,
          quantity: body.type === "OUT" ? quantity : quantity,
          unitCost: body.unitCost ? Number(body.unitCost) : null,
          currencyId: body.currencyId || null,
          exchangeRateId: body.exchangeRateId || null,
          referenceType: body.referenceType || null,
          referenceId: body.referenceId || null,
          notes: body.notes || null,
          createdById: user.id,
        },
      });

      return transaction;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    const message =
      error.message === "Item not found" || error.message === "Insufficient stock"
        ? error.message
        : "Internal server error";
    const status = error.message?.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
