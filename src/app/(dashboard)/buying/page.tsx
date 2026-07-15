import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { BuyingWorkspace } from "./client";

export default async function BuyingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [openPOs, pendingApproval, recentPOs, monthlyProcurement] =
    await Promise.all([
      prisma.purchaseOrder.count({
        where: { tenantId: user.tenantId, status: { notIn: ["RECEIVED", "CANCELLED"] } },
      }),
      prisma.purchaseOrder.count({
        where: { tenantId: user.tenantId, status: "PENDING_APPROVAL" },
      }),
      prisma.purchaseOrder.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          supplier: { select: { name: true } },
          currency: { select: { code: true, symbol: true } },
        },
      }),
      prisma.purchaseOrder.aggregate({
        where: {
          tenantId: user.tenantId,
          orderDate: { gte: thirtyDaysAgo },
          status: { notIn: ["DRAFT", "CANCELLED"] },
        },
        _sum: { total: true },
      }),
    ]);

  const serializedPOs = recentPOs.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    supplier: po.supplier,
    total: Number(po.total),
    status: po.status,
    orderDate: po.orderDate.toISOString(),
    currency: po.currency,
  }));

  return (
    <BuyingWorkspace
      metrics={{
        openPOs,
        pendingApproval,
        monthlyProcurement: Number(monthlyProcurement._sum.total || 0),
      }}
      recentPOs={serializedPOs}
    />
  );
}
