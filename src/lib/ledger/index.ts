/**
 * Double-entry posting engine for VuleraOS.
 * Every journal entry is posted through this module so debit=credit and
 * entry-numbering rules are enforced in exactly one place.
 */

import type { Prisma } from "@prisma/client";

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

  if (lines.length < 2) {
    throw new Error("A journal entry needs at least two lines.");
  }

  let debitCents = 0;
  let creditCents = 0;
  for (const line of lines) {
    if (line.amount <= 0) {
      throw new Error("Journal line amounts must be positive.");
    }
    if (line.direction === "debit") debitCents += toCents(line.amount);
    else creditCents += toCents(line.amount);
  }
  if (debitCents !== creditCents) {
    throw new Error(
      `Journal entry does not balance: debits ${debitCents / 100} vs credits ${creditCents / 100}.`
    );
  }

  const entryNumber = await generateEntryNumber(tx, tenantId, input.entryDate ?? new Date());

  const entry = await tx.journalEntry.create({
    data: {
      tenantId,
      entryNumber,
      entryDate: input.entryDate ?? new Date(),
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

  return entry;
}

async function generateEntryNumber(
  tx: Prisma.TransactionClient,
  tenantId: string,
  entryDate: Date
) {
  const year = entryDate.getFullYear();
  const count = await tx.journalEntry.count({
    where: {
      tenantId,
      entryNumber: { startsWith: `JE-${year}-` },
    },
  });
  return `JE-${year}-${String(count + 1).padStart(4, "0")}`;
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
