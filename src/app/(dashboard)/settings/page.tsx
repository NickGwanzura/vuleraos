import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { SettingsPage } from "./client";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
  });

  const serializedTenant = tenant
    ? {
        ...tenant,
        poApprovalThreshold:
          tenant.poApprovalThreshold !== null ? Number(tenant.poApprovalThreshold) : null,
        periodLockDate: tenant.periodLockDate ? tenant.periodLockDate.toISOString() : null,
      }
    : null;

  return <SettingsPage tenant={serializedTenant} />;
}
