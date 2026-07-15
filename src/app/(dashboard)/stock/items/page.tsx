import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { ItemsList } from "./client";

export default async function ItemsListPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.itemCategory.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    description: item.description,
    category: item.category,
    unitOfMeasure: item.unitOfMeasure,
    defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
    costPrice: item.costPrice ? Number(item.costPrice) : null,
    currentStock: Number(item.currentStock),
    minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
    valuationMethod: item.valuationMethod,
    currency: item.currency,
    barcode: item.barcode,
    createdAt: item.createdAt.toISOString(),
  }));

  return <ItemsList items={serializedItems} categories={categories} />;
}
