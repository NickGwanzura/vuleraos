import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { PaymentList } from "./client";

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const payments = await prisma.payment.findMany({
    where: { tenantId: user.tenantId },
    include: {
      invoice: { select: { id: true, invoiceNumber: true, customer: { select: { name: true } } } },
      currency: { select: { code: true, symbol: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 200,
  });

  const serialized = payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
    receivedAt: p.receivedAt.toISOString(),
  }));

  return <PaymentList payments={serialized} />;
}
