import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { notFound, redirect } from "next/navigation";
import { InvoiceDetail } from "./client";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const invoice = await prisma.salesInvoice.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      customer: {
        select: { id: true, name: true, bpNumber: true, email: true, phone: true, address: true, city: true },
      },
      currency: { select: { id: true, code: true, symbol: true } },
      exchangeRate: { select: { id: true, rate: true, parallelMarketRate: true } },
      createdBy: { select: { id: true, name: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, sku: true } },
          currency: { select: { code: true, symbol: true } },
        },
      },
      payments: {
        include: {
          currency: { select: { code: true, symbol: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { receivedAt: "desc" },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const serialized = {
    ...invoice,
    exchangeRate: invoice.exchangeRate ? {
      ...invoice.exchangeRate,
      rate: Number(invoice.exchangeRate.rate),
      parallelMarketRate: invoice.exchangeRate.parallelMarketRate ? Number(invoice.exchangeRate.parallelMarketRate) : null,
    } : null,
    subtotal: Number(invoice.subtotal),
    vatAmount: Number(invoice.vatAmount),
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    balanceDue: Number(invoice.balanceDue),
    vatRate: Number(invoice.vatRate),
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    items: invoice.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      vatRate: Number(item.vatRate),
      lineTotal: Number(item.lineTotal),
    })),
    payments: invoice.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      receivedAt: p.receivedAt.toISOString(),
    })),
  };

  return <InvoiceDetail invoice={serialized} />;
}
