import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { HrWorkspace } from "./client";

export default async function HrPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [activeEmployees, departments, pendingPayrolls, recentEmployees] =
    await Promise.all([
      prisma.employee.count({ where: { tenantId: user.tenantId, isActive: true } }),
      prisma.employee.findMany({
        where: { tenantId: user.tenantId, isActive: true, department: { not: null } },
        select: { department: true },
        distinct: ["department"],
      }),
      prisma.payrollRun.count({
        where: { tenantId: user.tenantId, status: { in: ["DRAFT", "PROCESSED"] } },
      }),
      prisma.employee.findMany({
        where: { tenantId: user.tenantId, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { currency: { select: { symbol: true } } },
      }),
    ]);

  const departmentList = [...new Set(departments.map((d) => d.department).filter(Boolean))];

  const serialized = recentEmployees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    employeeCode: e.employeeCode,
    department: e.department,
    position: e.position,
    basicSalary: e.basicSalary ? Number(e.basicSalary) : null,
    currency: e.currency,
  }));

  return (
    <HrWorkspace
      metrics={{
        activeEmployees,
        departments: departmentList.length,
        pendingPayrolls,
      }}
      recentEmployees={serialized}
    />
  );
}
