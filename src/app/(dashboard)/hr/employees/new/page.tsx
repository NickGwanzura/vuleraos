import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { EmployeeCreateForm } from "./client";

export default async function NewEmployeePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const currencies = await prisma.currency.findMany({
    where: { tenantId: user.tenantId, isActive: true },
  });

  return <EmployeeCreateForm currencies={currencies} />;
}
