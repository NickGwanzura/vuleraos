/**
 * Double-entry posting engine for VuleraOS.
 * Every journal entry is posted through this module so debit=credit and
 * entry-numbering rules are enforced in exactly one place.
 */

import type { Prisma } from "@prisma/client";
import { nextSequenceNumber } from "@/lib/sequence";

export interface JournalLineInput {
  accountId: string;
  direction: "debit" | "credit";
  amount: number;
  currencyId: string;
  exchangeRateId?: string | null;
  businessPartnerId?: string | null;
  description?: string;
}

export interface PostJournalEntryInput {
  tenantId: string;
  entryDate?: Date;
  memo?: string;
  sourceType: string;
  sourceId?: string | null;
  postedById: string;
  lines: JournalLineInput[];
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

/**
 * Post a balanced journal entry. Takes the caller's own transaction client
 * so it composes into whatever `$transaction` the calling route already
 * opened, rather than starting a second one.
 */
export async function postJournalEntry(
  tx: Prisma.TransactionClient,
  input: PostJournalEntryInput
) {
  const { tenantId, lines } = input;
  const entryDate = input.entryDate ?? new Date();

  const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  if (tenant.periodLockDate && entryDate <= tenant.periodLockDate) {
    throw new Error(
      `Cannot post to ${entryDate.toISOString().split("T")[0]} — the books are locked on or before ${tenant.periodLockDate.toISOString().split("T")[0]}.`
    );
  }

  if (lines.length < 2) {
    throw new Error("A journal entry needs at least two lines.");
  }

  // Debits and credits must balance within each currency separately — the
  // ledger doesn't consolidate currencies (see JournalLine comment), so a
  // global cross-currency sum would let mismatched amounts in different
  // currencies "balance" each other, which is meaningless.
  const byCurrency = new Map<string, { debit: number; credit: number }>();
  let debitCents = 0;
  let creditCents = 0;
  for (const line of lines) {
    if (line.amount <= 0) {
      throw new Error("Journal line amounts must be positive.");
    }
    const cents = toCents(line.amount);
    const bucket = byCurrency.get(line.currencyId) ?? { debit: 0, credit: 0 };
    if (line.direction === "debit") {
      debitCents += cents;
      bucket.debit += cents;
    } else {
      creditCents += cents;
      bucket.credit += cents;
    }
    byCurrency.set(line.currencyId, bucket);
  }
  for (const [currencyId, bucket] of byCurrency) {
    if (bucket.debit !== bucket.credit) {
      throw new Error(
        `Journal entry does not balance for currency ${currencyId}: debits ${bucket.debit / 100} vs credits ${bucket.credit / 100}.`
      );
    }
  }

  const seq = await nextSequenceNumber(tx, tenantId, "journal_entry", entryDate.getFullYear());
  const entryNumber = `JE-${entryDate.getFullYear()}-${String(seq).padStart(4, "0")}`;

  const entry = await tx.journalEntry.create({
    data: {
      tenantId,
      entryNumber,
      entryDate,
      memo: input.memo,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      postedById: input.postedById,
      lines: {
        create: lines.map((line) => ({
          accountId: line.accountId,
          debit: line.direction === "debit" ? line.amount : 0,
          credit: line.direction === "credit" ? line.amount : 0,
          currencyId: line.currencyId,
          exchangeRateId: line.exchangeRateId ?? null,
          businessPartnerId: line.businessPartnerId ?? null,
          description: line.description,
        })),
      },
    },
    include: { lines: true },
  });

  await tx.auditLog.create({
    data: {
      tenantId,
      userId: input.postedById,
      action: "post",
      entityType: "journal_entry",
      entityId: entry.id,
      changes: {
        entryNumber: entry.entryNumber,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        totalDebit: debitCents / 100,
      },
    },
  });

  return entry;
}

/**
 * Reverse a previously posted entry: creates a new entry with every line's
 * debit/credit swapped, and marks the original REVERSED. The original is
 * never edited or deleted, only superseded — its history stays intact.
 */
export async function reverseJournalEntry(
  tx: Prisma.TransactionClient,
  params: { tenantId: string; originalEntryId: string; postedById: string; memo?: string }
) {
  const original = await tx.journalEntry.findFirst({
    where: { id: params.originalEntryId, tenantId: params.tenantId },
    include: { lines: true },
  });
  if (!original) {
    throw new Error(`Journal entry ${params.originalEntryId} not found.`);
  }
  if (original.status === "REVERSED") {
    return null;
  }

  const reversal = await postJournalEntry(tx, {
    tenantId: params.tenantId,
    memo: params.memo ?? `Reversal of ${original.entryNumber}`,
    sourceType: "reversal",
    sourceId: original.id,
    postedById: params.postedById,
    lines: original.lines.map((line) => ({
      accountId: line.accountId,
      direction: Number(line.debit) > 0 ? "credit" : "debit",
      amount: Number(line.debit) > 0 ? Number(line.debit) : Number(line.credit),
      currencyId: line.currencyId,
      exchangeRateId: line.exchangeRateId,
      businessPartnerId: line.businessPartnerId,
      description: line.description ?? undefined,
    })),
  });

  await tx.journalEntry.update({
    where: { id: original.id },
    data: { status: "REVERSED" },
  });

  await tx.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.postedById,
      action: "reverse",
      entityType: "journal_entry",
      entityId: original.id,
      changes: {
        reversedBy: reversal?.entryNumber,
      },
    },
  });

  return reversal;
}

/**
 * Reverse every not-yet-reversed entry posted for a given source document.
 * Used by cancellation handlers, which have no other record of what (if
 * anything) was posted for them.
 */
export async function reverseEntriesForSource(
  tx: Prisma.TransactionClient,
  params: { tenantId: string; sourceType: string; sourceId: string; postedById: string }
) {
  const entries = await tx.journalEntry.findMany({
    where: {
      tenantId: params.tenantId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      status: "POSTED",
    },
  });
  const reversals: NonNullable<Awaited<ReturnType<typeof reverseJournalEntry>>>[] = [];
  for (const entry of entries) {
    const reversal = await reverseJournalEntry(tx, {
      tenantId: params.tenantId,
      originalEntryId: entry.id,
      postedById: params.postedById,
    });
    if (reversal) reversals.push(reversal);
  }
  return reversals;
}
