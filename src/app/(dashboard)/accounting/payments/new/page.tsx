import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { RecordPaymentForm } from "./client";

export default async function NewPaymentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [customers, currencies] = await Promise.all([
    prisma.businessPartner.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        partnerType: { in: ["CUSTOMER", "BOTH"] },
      },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    }),
  ]);

  return <RecordPaymentForm customers={customers} currencies={currencies} />;
}
