import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { InvoiceList } from "./client";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const invoices = await prisma.salesInvoice.findMany({
    where: { tenantId: user.tenantId },
    include: {
      customer: { select: { id: true, name: true } },
      currency: { select: { code: true, symbol: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const serialized = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customer: inv.customer,
    total: Number(inv.total),
    status: inv.status,
    issueDate: inv.issueDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    balanceDue: Number(inv.balanceDue),
    amountPaid: Number(inv.amountPaid),
    currency: inv.currency,
  }));

  return <InvoiceList invoices={serialized} />;
}
