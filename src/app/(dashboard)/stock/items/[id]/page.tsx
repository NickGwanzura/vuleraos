import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { notFound, redirect } from "next/navigation";
import { ItemDetail } from "./client";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [item, transactions, categories, currencies] = await Promise.all([
    prisma.item.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        category: { select: { id: true, name: true } },
        currency: { select: { id: true, code: true, symbol: true } },
      },
    }),
    prisma.stockTransaction.findMany({
      where: { itemId: id, tenantId: user.tenantId },
      include: {
        createdBy: { select: { name: true } },
        currency: { select: { code: true, symbol: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.itemCategory.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    }),
  ]);

  if (!item) {
    notFound();
  }

  const serializedItem = {
    ...item,
    defaultPrice: item.defaultPrice ? Number(item.defaultPrice) : null,
    costPrice: item.costPrice ? Number(item.costPrice) : null,
    currentStock: Number(item.currentStock),
    minimumStock: item.minimumStock ? Number(item.minimumStock) : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };

  const serializedTransactions = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    quantity: Number(t.quantity),
    unitCost: t.unitCost ? Number(t.unitCost) : null,
    referenceType: t.referenceType,
    referenceId: t.referenceId,
    notes: t.notes,
    createdBy: t.createdBy,
    currency: t.currency,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <ItemDetail
      item={serializedItem}
      transactions={serializedTransactions}
      categories={categories}
      currencies={currencies}
    />
  );
}
