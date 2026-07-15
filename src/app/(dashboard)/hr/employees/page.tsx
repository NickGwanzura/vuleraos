import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { EmployeeList } from "./client";

export default async function EmployeesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const employees = await prisma.employee.findMany({
    where: { tenantId: user.tenantId },
    include: { currency: { select: { code: true, symbol: true } } },
    orderBy: [{ isActive: "desc" }, { firstName: "asc" }],
  });

  const serialized = employees.map((e) => ({
    ...e,
    basicSalary: e.basicSalary ? Number(e.basicSalary) : null,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() || null,
  }));

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean) as string[])];

  return <EmployeeList employees={serialized} departments={departments} />;
}
