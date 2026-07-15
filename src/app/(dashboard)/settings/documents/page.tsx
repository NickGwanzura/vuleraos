import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { DocumentSettings } from "./client";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  const template = await prisma.documentTemplate.findFirst({
    where: { tenantId: user.tenantId, type: "invoice" },
  });

  return <DocumentSettings tenant={tenant} template={template} />;
}
