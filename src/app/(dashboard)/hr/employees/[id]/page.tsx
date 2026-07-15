import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { notFound, redirect } from "next/navigation";
import { EmployeeDetail } from "./client";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const employee = await prisma.employee.findFirst({
    where: { id, tenantId: user.tenantId },
    include: { currency: { select: { id: true, code: true, symbol: true } } },
  });

  if (!employee) notFound();

  const serialized = {
    ...employee,
    basicSalary: employee.basicSalary ? Number(employee.basicSalary) : null,
    startDate: employee.startDate.toISOString(),
    endDate: employee.endDate?.toISOString() || null,
  };

  return <EmployeeDetail employee={serialized} />;
}
