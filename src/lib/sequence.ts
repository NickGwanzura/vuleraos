/**
 * Gapless, per-tenant sequential numbering.
 *
 * The previous approach (count existing rows, zero-pad) races under
 * concurrent requests, with the document's `@@unique` constraint as the
 * only backstop — the losing request just gets a 500. This upsert compiles
 * to an atomic `UPDATE ... SET value = value + 1`, which Postgres row-locks
 * within the caller's transaction: concurrent requests serialize instead of
 * racing, and a failed transaction rolls its increment back too, so no
 * number is ever skipped or reused.
 */

import type { Prisma } from "@prisma/client";

export async function nextSequenceNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
  key: string,
  year: number
): Promise<number> {
  const seq = await tx.numberSequence.upsert({
    where: { tenantId_key_year: { tenantId, key, year } },
    create: { tenantId, key, year, value: 1 },
    update: { value: { increment: 1 } },
  });
  return seq.value;
}
