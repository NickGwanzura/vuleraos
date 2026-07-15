import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { notFound, redirect } from "next/navigation";
import { PayrollDetail } from "./client";

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const run = await prisma.payrollRun.findFirst({
    where: { id, tenantId: user.tenantId },
    include: {
      currency: { select: { code: true, symbol: true } },
      processedBy: { select: { name: true } },
      items: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true, position: true, bankName: true, bankAccount: true, nssaNumber: true, taxIdNumber: true },
          },
          currency: { select: { code: true, symbol: true } },
        },
      },
    },
  });

  if (!run) notFound();

  const serialized = {
    ...run,
    totalGross: Number(run.totalGross),
    totalDeductions: Number(run.totalDeductions),
    totalNet: Number(run.totalNet),
    totalPaye: Number(run.totalPaye),
    totalNssa: Number(run.totalNssa),
    totalNec: Number(run.totalNec),
    totalAid: Number(run.totalAid),
    periodStart: run.periodStart.toISOString(),
    periodEnd: run.periodEnd.toISOString(),
    items: run.items.map((item) => ({
      ...item,
      grossPay: Number(item.grossPay),
      payeTax: Number(item.payeTax),
      nssaDeduction: Number(item.nssaDeduction),
      necDeduction: Number(item.necDeduction),
      aidDeduction: Number(item.aidDeduction),
      otherDeductions: Number(item.otherDeductions),
      totalDeductions: Number(item.totalDeductions),
      netPay: Number(item.netPay),
    })),
  };

  return <PayrollDetail payroll={serialized} />;
}
