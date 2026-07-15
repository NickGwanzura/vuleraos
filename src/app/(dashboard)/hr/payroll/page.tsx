import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { PayrollList } from "./client";

export default async function PayrollPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const runs = await prisma.payrollRun.findMany({
    where: { tenantId: user.tenantId },
    include: {
      currency: { select: { code: true, symbol: true } },
      processedBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = runs.map((r) => ({
    ...r,
    totalGross: Number(r.totalGross),
    totalDeductions: Number(r.totalDeductions),
    totalNet: Number(r.totalNet),
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
  }));

  return <PayrollList runs={serialized} />;
}
