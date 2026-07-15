import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { AccountingWorkspace } from "./client";

export default async function AccountingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [unreconciled, recentPayments, arInvoices, apOrders] = await Promise.all([
    prisma.payment.count({
      where: { tenantId: user.tenantId, isReconciled: false },
    }),
    prisma.payment.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { receivedAt: "desc" },
      take: 5,
      include: {
        invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } },
        currency: { select: { code: true, symbol: true } },
      },
    }),
    prisma.salesInvoice.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ["FISCAL", "PARTIALLY_PAID", "OVERDUE"] },
      },
      select: { balanceDue: true },
    }),
    prisma.purchaseOrder.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"] },
      },
      select: { total: true },
    }),
  ]);

  const arTotal = arInvoices.reduce((sum, i) => sum + Number(i.balanceDue), 0);
  const apTotal = apOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const serializedPayments = recentPayments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    isReconciled: p.isReconciled,
    referenceNumber: p.referenceNumber,
    receivedAt: p.receivedAt.toISOString(),
    invoice: p.invoice,
    currency: p.currency,
  }));

  return (
    <AccountingWorkspace
      metrics={{
        unreconciled,
        arTotal,
        apTotal,
      }}
      recentPayments={serializedPayments}
    />
  );
}
