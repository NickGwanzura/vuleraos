import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { StockWorkspace } from "./client";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch workspace metrics
  const [totalItems, allItems, recentItems] = await Promise.all([
    prisma.item.count({ where: { tenantId: user.tenantId, isActive: true } }),
    prisma.item.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        minimumStock: { not: null },
      },
      select: { currentStock: true, minimumStock: true },
    }),
    prisma.item.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: { select: { name: true } },
        currency: { select: { symbol: true } },
      },
    }),
  ]);

  const lowStockCount = allItems.filter(
    (item) => Number(item.currentStock) <= Number(item.minimumStock)
  ).length;

  const serializedItems = recentItems.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    currentStock: Number(item.currentStock),
    minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
    defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
    category: item.category,
    currency: item.currency,
  }));

  return (
    <StockWorkspace
      metrics={{
        totalItems,
        lowStockCount,
      }}
      recentItems={serializedItems}
    />
  );
}
