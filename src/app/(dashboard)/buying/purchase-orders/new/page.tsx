import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { POCreateForm } from "./client";

export default async function NewPOPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [suppliers, currencies] = await Promise.all([
    prisma.businessPartner.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        partnerType: { in: ["SUPPLIER", "BOTH"] },
      },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    }),
  ]);

  return <POCreateForm suppliers={suppliers} currencies={currencies} />;
}
