import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { FiscalDevicesSettings } from "./client";

export default async function FiscalDevicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const devices = await prisma.fiscalDevice.findMany({
    where: { tenantId: user.tenantId },
    include: { _count: { select: { salesInvoices: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = devices.map((d) => ({
    ...d,
    lastCommunication: d.lastCommunication?.toISOString() || null,
    createdAt: d.createdAt.toISOString(),
  }));

  return <FiscalDevicesSettings devices={serialized} />;
}
