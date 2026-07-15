import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { SalesWorkspace } from "./client";

export default async function SalesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [openInvoices, overdueInvoices, recentInvoices, monthlyRevenue] =
    await Promise.all([
      prisma.salesInvoice.count({
        where: {
          tenantId: user.tenantId,
          status: { in: ["DRAFT", "FISCAL", "PARTIALLY_PAID"] },
        },
      }),
      prisma.salesInvoice.count({
        where: {
          tenantId: user.tenantId,
          OR: [
            { status: "OVERDUE" },
            { status: "FISCAL", dueDate: { lt: new Date() } },
          ],
        },
      }),
      prisma.salesInvoice.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true } },
          currency: { select: { code: true, symbol: true } },
        },
      }),
      prisma.salesInvoice.aggregate({
        where: {
          tenantId: user.tenantId,
          issueDate: { gte: thirtyDaysAgo },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
    ]);

  const serializedInvoices = recentInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customer: inv.customer,
    total: Number(inv.total),
    status: inv.status,
    issueDate: inv.issueDate.toISOString(),
    balanceDue: Number(inv.balanceDue),
    currency: inv.currency,
  }));

  return (
    <SalesWorkspace
      metrics={{
        openInvoices,
        overdueInvoices,
        monthlyRevenue: Number(monthlyRevenue._sum.total || 0),
      }}
      recentInvoices={serializedInvoices}
    />
  );
}
