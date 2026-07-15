import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.item.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        category: { select: { id: true, name: true } },
        currency: { select: { id: true, code: true, symbol: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
      costPrice: item.costPrice ? Number(item.costPrice) : null,
      currentStock: Number(item.currentStock),
      minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const existing = await prisma.item.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        sku: body.sku ?? undefined,
        description: body.description !== undefined ? body.description : undefined,
        categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
        unitOfMeasure: body.unitOfMeasure ?? undefined,
        defaultPrice: body.defaultPrice !== undefined ? Number(body.defaultPrice) : undefined,
        costPrice: body.costPrice !== undefined ? Number(body.costPrice) : undefined,
        currencyId: body.currencyId !== undefined ? body.currencyId : undefined,
        minimumStock: body.minimumStock !== undefined ? (body.minimumStock ? Number(body.minimumStock) : null) : undefined,
        valuationMethod: body.valuationMethod ?? undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        barcode: body.barcode !== undefined ? body.barcode : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        currency: { select: { id: true, code: true, symbol: true } },
      },
    });

    return NextResponse.json({
      ...item,
      defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
      costPrice: item.costPrice ? Number(item.costPrice) : null,
      currentStock: Number(item.currentStock),
      minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
    });
  } catch (error: any) {
    console.error("Error updating item:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "An item with this SKU already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.item.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Soft delete by marking inactive
    await prisma.item.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
