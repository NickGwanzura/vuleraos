import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { getCached, tenantCacheKey, invalidatePattern } from "@/lib/redis/cache";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const isActive = searchParams.get("isActive");
    const lowStock = searchParams.get("lowStock") === "true";

    // Use cache for non-search queries
    if (!search && !categoryId && !lowStock) {
      const cached = await getCached(
        tenantCacheKey(user.tenantId, "stock:items"),
        async () => {
          const items = await prisma.item.findMany({
            where: { tenantId: user.tenantId, isActive: true },
            include: {
              category: { select: { id: true, name: true } },
              currency: { select: { code: true, symbol: true } },
            },
            orderBy: { name: "asc" },
          });
          return items.map((item) => ({
            ...item,
            defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
            costPrice: item.costPrice ? Number(item.costPrice) : null,
            currentStock: Number(item.currentStock),
            minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
          }));
        },
        60
      );
      return NextResponse.json(cached);
    }

    const where: any = { tenantId: user.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const items = await prisma.item.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
      },
      orderBy: { name: "asc" },
    });

    // Handle low stock filtering in JS (field-to-field comparison)
    let filteredItems = items;
    if (lowStock) {
      filteredItems = items.filter(
        (item) =>
          item.minimumStock !== null &&
          Number(item.currentStock) <= Number(item.minimumStock)
      );
    }

    const serialized = filteredItems.map((item) => ({
      ...item,
      defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
      costPrice: item.costPrice ? Number(item.costPrice) : null,
      currentStock: Number(item.currentStock),
      minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching items:", error);
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

    const item = await prisma.item.create({
      data: {
        tenantId: user.tenantId,
        name: body.name,
        sku: body.sku,
        description: body.description || null,
        categoryId: body.categoryId || null,
        unitOfMeasure: body.unitOfMeasure || "each",
        defaultPrice: body.defaultPrice ? Number(body.defaultPrice) : null,
        costPrice: body.costPrice ? Number(body.costPrice) : null,
        currencyId: body.currencyId || null,
        currentStock: body.currentStock ? Number(body.currentStock) : 0,
        minimumStock: body.minimumStock ? Number(body.minimumStock) : null,
        valuationMethod: body.valuationMethod || "FIFO",
        isActive: body.isActive !== false,
        barcode: body.barcode || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
      },
    });

    // Invalidate cache
    await invalidatePattern(`*stock:items*`);

    return NextResponse.json(
      {
        ...item,
        defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
        costPrice: item.costPrice ? Number(item.costPrice) : null,
        currentStock: Number(item.currentStock),
        minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating item:", error);
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
