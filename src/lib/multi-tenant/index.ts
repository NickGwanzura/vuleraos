import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

/**
 * Get the tenant ID from the current session.
 */
export async function resolveTenantId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.tenantId ?? null;
  } catch {
    return null;
  }
}

/**
 * Require a valid tenant context. Throws if no session or tenant.
 */
export async function requireTenant(): Promise<{
  tenantId: string;
  userId: string;
  role: string;
}> {
  const user = await getCurrentUser();
  if (!user?.tenantId) {
    throw new Error("Unauthorized: No tenant context");
  }
  return {
    tenantId: user.tenantId,
    userId: user.id,
    role: user.role,
  };
}

/**
 * Require a specific role (or one of) for an action.
 */
export async function requireRole(...roles: string[]) {
  const context = await requireTenant();
  if (!roles.includes(context.role)) {
    throw new Error(`Forbidden: Requires one of roles: ${roles.join(", ")}`);
  }
  return context;
}

/**
 * Get the Prisma client instance.
 */
export function getScopedPrisma() {
  return prisma;
}
