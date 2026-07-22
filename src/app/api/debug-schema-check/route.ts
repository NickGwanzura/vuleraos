import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/client";

// TEMPORARY, no-auth: verifying the add_p2_controls migration actually
// landed after a production crash-loop/failed-migration recovery. Returns
// only schema metadata (column/migration names), no customer or financial
// data. Remove immediately after use.
export async function GET() {
  const tenantCols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name IN ('periodLockDate', 'poApprovalThreshold')
  `;
  const payrollCols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'payroll_runs' AND column_name = 'approvedById'
  `;
  const numberSequencesTable = await prisma.$queryRaw<{ name: string | null }[]>`
    SELECT to_regclass('number_sequences') AS name
  `;
  const enumValues = await prisma.$queryRaw<{ enumlabel: string }[]>`
    SELECT enumlabel FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payroll_status')
  `;
  const migrations = await prisma.$queryRaw<
    { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
  >`
    SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at
  `;

  return NextResponse.json({
    tenantCols,
    payrollCols,
    numberSequencesTable,
    enumValues,
    migrations,
  });
}
