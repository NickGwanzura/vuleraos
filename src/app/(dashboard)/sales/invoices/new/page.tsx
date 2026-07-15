import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { InvoiceCreateForm } from "./client";

export default async function NewInvoicePage() {
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

  return (
    <InvoiceCreateForm
      customers={customers}
      currencies={currencies}
    />
  );
}
