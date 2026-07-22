-- AlterEnum
ALTER TYPE "payroll_status" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "periodLockDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "poApprovalThreshold" DECIMAL(18,2);

-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN IF NOT EXISTS "approvedById" UUID;

-- CreateTable
CREATE TABLE IF NOT EXISTS "number_sequences" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "number_sequences_tenantId_key_year_key" ON "number_sequences"("tenantId", "key", "year");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
