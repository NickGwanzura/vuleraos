/**
 * Posting rules: translate a real-world event (invoice fiscalised, payment
 * received, goods received, payroll run/paid) into balanced journal lines.
 * One function per event — this is the only place that decides which
 * accounts a given document type hits.
 */

import type { Prisma } from "@prisma/client";
import { postJournalEntry, reverseEntriesForSource } from "./index";
import { ACCOUNT_CODES, getAccount } from "./accounts";

interface InvoiceForPosting {
  id: string;
  tenantId: string;
  customerId: string;
  currencyId: string;
  exchangeRateId: string | null;
  subtotal: Prisma.Decimal | number;
  vatAmount: Prisma.Decimal | number;
  total: Prisma.Decimal | number;
}

export async function postInvoiceFiscalised(
  tx: Prisma.TransactionClient,
  invoice: InvoiceForPosting,
  postedById: string
) {
  const [ar, revenue, vatPayable] = await Promise.all([
    getAccount(tx, invoice.tenantId, ACCOUNT_CODES.ACCOUNTS_RECEIVABLE),
    getAccount(tx, invoice.tenantId, ACCOUNT_CODES.SALES_REVENUE),
    getAccount(tx, invoice.tenantId, ACCOUNT_CODES.VAT_OUTPUT_PAYABLE),
  ]);

  const subtotal = Number(invoice.subtotal);
  const vat = Number(invoice.vatAmount);
  const total = Number(invoice.total);

  const lines = [
    {
      accountId: ar.id,
      direction: "debit" as const,
      amount: total,
      currencyId: invoice.currencyId,
      exchangeRateId: invoice.exchangeRateId,
      businessPartnerId: invoice.customerId,
    },
    {
      accountId: revenue.id,
      direction: "credit" as const,
      amount: subtotal,
      currencyId: invoice.currencyId,
      exchangeRateId: invoice.exchangeRateId,
      businessPartnerId: invoice.customerId,
    },
  ];
  if (vat > 0) {
    lines.push({
      accountId: vatPayable.id,
      direction: "credit" as const,
      amount: vat,
      currencyId: invoice.currencyId,
      exchangeRateId: invoice.exchangeRateId,
      businessPartnerId: invoice.customerId,
    });
  }

  return postJournalEntry(tx, {
    tenantId: invoice.tenantId,
    memo: "Invoice fiscalised",
    sourceType: "sales_invoice",
    sourceId: invoice.id,
    postedById,
    lines,
  });
}

export async function reverseInvoicePostings(
  tx: Prisma.TransactionClient,
  params: { tenantId: string; invoiceId: string; postedById: string }
) {
  return reverseEntriesForSource(tx, {
    tenantId: params.tenantId,
    sourceType: "sales_invoice",
    sourceId: params.invoiceId,
    postedById: params.postedById,
  });
}

interface PaymentForPosting {
  id: string;
  tenantId: string;
  amount: Prisma.Decimal | number;
  currencyId: string;
  exchangeRateId: string | null;
  paymentMethod: string;
  invoice?: { customerId: string } | null;
}

export async function postPaymentReceived(
  tx: Prisma.TransactionClient,
  payment: PaymentForPosting,
  postedById: string
) {
  const cashOrBankCode =
    payment.paymentMethod === "CASH" ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK;
  const [cashOrBank, ar] = await Promise.all([
    getAccount(tx, payment.tenantId, cashOrBankCode),
    getAccount(tx, payment.tenantId, ACCOUNT_CODES.ACCOUNTS_RECEIVABLE),
  ]);

  const amount = Number(payment.amount);

  return postJournalEntry(tx, {
    tenantId: payment.tenantId,
    memo: "Payment received",
    sourceType: "payment",
    sourceId: payment.id,
    postedById,
    lines: [
      {
        accountId: cashOrBank.id,
        direction: "debit",
        amount,
        currencyId: payment.currencyId,
        exchangeRateId: payment.exchangeRateId,
        businessPartnerId: payment.invoice?.customerId ?? null,
      },
      {
        accountId: ar.id,
        direction: "credit",
        amount,
        currencyId: payment.currencyId,
        exchangeRateId: payment.exchangeRateId,
        businessPartnerId: payment.invoice?.customerId ?? null,
      },
    ],
  });
}

export async function reversePaymentPostings(
  tx: Prisma.TransactionClient,
  params: { tenantId: string; paymentId: string; postedById: string }
) {
  return reverseEntriesForSource(tx, {
    tenantId: params.tenantId,
    sourceType: "payment",
    sourceId: params.paymentId,
    postedById: params.postedById,
  });
}

interface GoodsReceiptForPosting {
  tenantId: string;
  purchaseOrderId: string;
  supplierId: string;
  currencyId: string;
  exchangeRateId: string | null;
  quantity: number;
  unitCost: number;
}

export async function postGoodsReceipt(
  tx: Prisma.TransactionClient,
  receipt: GoodsReceiptForPosting,
  postedById: string
) {
  const [inventory, ap] = await Promise.all([
    getAccount(tx, receipt.tenantId, ACCOUNT_CODES.INVENTORY),
    getAccount(tx, receipt.tenantId, ACCOUNT_CODES.ACCOUNTS_PAYABLE),
  ]);

  const amount = receipt.quantity * receipt.unitCost;
  if (amount <= 0) return null;

  return postJournalEntry(tx, {
    tenantId: receipt.tenantId,
    memo: "Goods received against purchase order",
    sourceType: "purchase_order",
    sourceId: receipt.purchaseOrderId,
    postedById,
    lines: [
      {
        accountId: inventory.id,
        direction: "debit",
        amount,
        currencyId: receipt.currencyId,
        exchangeRateId: receipt.exchangeRateId,
        businessPartnerId: receipt.supplierId,
      },
      {
        accountId: ap.id,
        direction: "credit",
        amount,
        currencyId: receipt.currencyId,
        exchangeRateId: receipt.exchangeRateId,
        businessPartnerId: receipt.supplierId,
      },
    ],
  });
}

export async function reversePOPostings(
  tx: Prisma.TransactionClient,
  params: { tenantId: string; purchaseOrderId: string; postedById: string }
) {
  return reverseEntriesForSource(tx, {
    tenantId: params.tenantId,
    sourceType: "purchase_order",
    sourceId: params.purchaseOrderId,
    postedById: params.postedById,
  });
}

interface PayrollRunForPosting {
  id: string;
  tenantId: string;
  currencyId: string;
  totalGross: Prisma.Decimal | number;
  totalNet: Prisma.Decimal | number;
  totalPaye: Prisma.Decimal | number;
  totalNssa: Prisma.Decimal | number;
  totalNec: Prisma.Decimal | number;
  totalAid: Prisma.Decimal | number;
}

export async function postPayrollAccrual(
  tx: Prisma.TransactionClient,
  run: PayrollRunForPosting,
  postedById: string
) {
  const [expense, payePayable, nssaPayable, necPayable, aidsPayable, salariesPayable] =
    await Promise.all([
      getAccount(tx, run.tenantId, ACCOUNT_CODES.SALARIES_EXPENSE),
      getAccount(tx, run.tenantId, ACCOUNT_CODES.PAYE_PAYABLE),
      getAccount(tx, run.tenantId, ACCOUNT_CODES.NSSA_PAYABLE),
      getAccount(tx, run.tenantId, ACCOUNT_CODES.NEC_PAYABLE),
      getAccount(tx, run.tenantId, ACCOUNT_CODES.AIDS_PAYABLE),
      getAccount(tx, run.tenantId, ACCOUNT_CODES.SALARIES_PAYABLE),
    ]);

  const gross = Number(run.totalGross);
  const net = Number(run.totalNet);
  const paye = Number(run.totalPaye);
  const nssa = Number(run.totalNssa);
  const nec = Number(run.totalNec);
  const aid = Number(run.totalAid);

  const lines = [
    { accountId: expense.id, direction: "debit" as const, amount: gross, currencyId: run.currencyId },
    { accountId: salariesPayable.id, direction: "credit" as const, amount: net, currencyId: run.currencyId },
  ];
  if (paye > 0) lines.push({ accountId: payePayable.id, direction: "credit" as const, amount: paye, currencyId: run.currencyId });
  if (nssa > 0) lines.push({ accountId: nssaPayable.id, direction: "credit" as const, amount: nssa, currencyId: run.currencyId });
  if (nec > 0) lines.push({ accountId: necPayable.id, direction: "credit" as const, amount: nec, currencyId: run.currencyId });
  if (aid > 0) lines.push({ accountId: aidsPayable.id, direction: "credit" as const, amount: aid, currencyId: run.currencyId });

  return postJournalEntry(tx, {
    tenantId: run.tenantId,
    memo: "Payroll accrual",
    sourceType: "payroll_run",
    sourceId: run.id,
    postedById,
    lines,
  });
}

export async function postPayrollSettlement(
  tx: Prisma.TransactionClient,
  run: PayrollRunForPosting,
  postedById: string
) {
  const [salariesPayable, bank] = await Promise.all([
    getAccount(tx, run.tenantId, ACCOUNT_CODES.SALARIES_PAYABLE),
    getAccount(tx, run.tenantId, ACCOUNT_CODES.BANK),
  ]);

  const net = Number(run.totalNet);

  return postJournalEntry(tx, {
    tenantId: run.tenantId,
    memo: "Payroll paid",
    sourceType: "payroll_run",
    sourceId: run.id,
    postedById,
    lines: [
      { accountId: salariesPayable.id, direction: "debit", amount: net, currencyId: run.currencyId },
      { accountId: bank.id, direction: "credit", amount: net, currencyId: run.currencyId },
    ],
  });
}

export async function reversePayrollPostings(
  tx: Prisma.TransactionClient,
  params: { tenantId: string; payrollRunId: string; postedById: string }
) {
  return reverseEntriesForSource(tx, {
    tenantId: params.tenantId,
    sourceType: "payroll_run",
    sourceId: params.payrollRunId,
    postedById: params.postedById,
  });
}
