import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { DashboardClient } from "./client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch dashboard metrics
  const [openInvoices, allItems, pendingPayments, recentInvoices] =
    await Promise.all([
      // Open invoices count
      prisma.salesInvoice.count({
        where: {
          tenantId: user.tenantId,
          status: { in: ["DRAFT", "FISCAL", "PARTIALLY_PAID", "OVERDUE"] },
        },
      }),
      // Get all items for low stock check (need to compare fields in code)
      prisma.item.findMany({
        where: {
          tenantId: user.tenantId,
          isActive: true,
          minimumStock: { not: null },
        },
        select: { currentStock: true, minimumStock: true },
      }),
      // Pending payments
      prisma.payment.count({
        where: {
          tenantId: user.tenantId,
          isReconciled: false,
        },
      }),
      // Recent invoices
      prisma.salesInvoice.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true } },
          currency: { select: { code: true, symbol: true } },
        },
      }),
    ]);

  // Calculate low stock items in JS
  const lowStockItems = allItems.filter(
    (item) => Number(item.currentStock) <= Number(item.minimumStock)
  ).length;

  // Convert Decimal to number for serialization
  const serializedInvoices = recentInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customer: inv.customer,
    total: Number(inv.total),
    status: inv.status,
    issueDate: inv.issueDate.toISOString(),
    currency: inv.currency,
  }));

  return (
    <DashboardClient
      userName={user.name ?? "User"}
      metrics={{
        openInvoices,
        lowStockItems,
        pendingPayments,
      }}
      recentInvoices={serializedInvoices}
    />
  );
}
