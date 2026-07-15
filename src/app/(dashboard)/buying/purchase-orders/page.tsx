import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { POList } from "./client";

export default async function PurchaseOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.purchaseOrder.findMany({
    where: { tenantId: user.tenantId },
    include: {
      supplier: { select: { id: true, name: true } },
      currency: { select: { code: true, symbol: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = orders.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    supplier: po.supplier,
    total: Number(po.total),
    status: po.status,
    orderDate: po.orderDate.toISOString(),
    expectedDate: po.expectedDate?.toISOString() || null,
    currency: po.currency,
    createdBy: po.createdBy,
  }));

  return <POList orders={serialized} />;
}
