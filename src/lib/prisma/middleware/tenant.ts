/**
 * Tenant isolation helpers.
 * 
 * Instead of Prisma middleware ($use was removed in Prisma v6),
 * we enforce tenant isolation at the application layer:
 * 1. Server components / API routes must call requireTenant() to get the tenant context
 * 2. Every query should include tenantId in the where clause
 * 3. RLS (Row-Level Security) on PostgreSQL serves as the hard database-level backup
 * 
 * This file is kept for documentation — actual enforcement happens via:
 * - src/lib/multi-tenant/index.ts (requireTenant, requireRole)
 * - PostgreSQL RLS policies (applied in initial migration)
 */

export {};
