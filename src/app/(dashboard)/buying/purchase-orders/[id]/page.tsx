import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { notFound, redirect } from "next/navigation";
import { PODetail } from "./client";

export default async function PODetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const po = await prisma.purchaseOrder.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      supplier: { select: { id: true, name: true, bpNumber: true, email: true, phone: true } },
      currency: { select: { id: true, code: true, symbol: true } },
      exchangeRate: { select: { id: true, rate: true } },
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: {
          item: { select: { id: true, name: true, sku: true } },
        },
      },
    },
  });

  if (!po) notFound();

  const serialized = {
    ...po,
    exchangeRate: po.exchangeRate ? { ...po.exchangeRate, rate: Number(po.exchangeRate.rate) } : null,
    subtotal: Number(po.subtotal),
    vatAmount: Number(po.vatAmount),
    total: Number(po.total),
    orderDate: po.orderDate.toISOString(),
    expectedDate: po.expectedDate?.toISOString() || null,
    createdAt: po.createdAt.toISOString(),
    items: po.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      quantityReceived: Number(item.quantityReceived),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };

  return <PODetail po={serialized} />;
}
