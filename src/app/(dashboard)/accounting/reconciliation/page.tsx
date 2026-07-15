import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { ReconciliationView } from "./client";

export default async function ReconciliationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [unmatchedPayments, unpaidInvoices] = await Promise.all([
    prisma.payment.findMany({
      where: { tenantId: user.tenantId, isReconciled: false },
      include: {
        invoice: { select: { id: true, invoiceNumber: true, customer: { select: { name: true } } } },
        currency: { select: { code: true, symbol: true } },
      },
      orderBy: { receivedAt: "desc" },
    }),
    prisma.salesInvoice.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ["FISCAL", "PARTIALLY_PAID", "OVERDUE"] },
        balanceDue: { gt: 0 },
      },
      include: {
        customer: { select: { name: true } },
        currency: { select: { code: true, symbol: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const serializedPayments = unmatchedPayments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod,
    referenceNumber: p.referenceNumber,
    receivedAt: p.receivedAt.toISOString(),
    currency: p.currency,
    invoice: p.invoice,
  }));

  const serializedInvoices = unpaidInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customer: inv.customer,
    total: Number(inv.total),
    balanceDue: Number(inv.balanceDue),
    dueDate: inv.dueDate.toISOString(),
    currency: inv.currency,
  }));

  return (
    <ReconciliationView
      unmatchedPayments={serializedPayments}
      unpaidInvoices={serializedInvoices}
    />
  );
}
