import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { ItemCreateForm } from "./client";

export default async function NewItemPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [categories, currencies] = await Promise.all([
    prisma.itemCategory.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    }),
  ]);

  return (
    <ItemCreateForm categories={categories} currencies={currencies} />
  );
}
