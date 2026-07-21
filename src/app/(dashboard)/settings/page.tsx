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

  return <SettingsPage tenant={tenant} />;
}
