import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { UserManagement } from "./client";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const users = await prisma.user.findMany({
    where: { tenantId: user.tenantId },
    select: {
      id: true, email: true, name: true, role: true, isActive: true,
      onboardingCompleted: true, createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

  return <UserManagement users={serialized} currentUserId={user.id} currentUserRole={user.role} />;
}
