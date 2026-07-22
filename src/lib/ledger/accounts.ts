/**
 * Chart of accounts for VuleraOS.
 * Defines the default per-tenant account set and a lookup helper posting
 * rules use to resolve a well-known account by code.
 */

import type { Prisma } from "@prisma/client";

export const ACCOUNT_CODES = {
  CASH: "1000",
  BANK: "1010",
  ACCOUNTS_RECEIVABLE: "1100",
  INVENTORY: "1200",
  ACCOUNTS_PAYABLE: "2000",
  VAT_OUTPUT_PAYABLE: "2100",
  PAYE_PAYABLE: "2200",
  NSSA_PAYABLE: "2210",
  NEC_PAYABLE: "2220",
  AIDS_PAYABLE: "2230",
  SALARIES_PAYABLE: "2900",
  RETAINED_EARNINGS: "3000",
  OWNERS_CAPITAL: "3100",
  SALES_REVENUE: "4000",
  COST_OF_GOODS_SOLD: "5000",
  SALARIES_EXPENSE: "5100",
  GENERAL_EXPENSE: "5900",
} as const;

export const DEFAULT_CHART_OF_ACCOUNTS: {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
}[] = [
  { code: ACCOUNT_CODES.CASH, name: "Cash on Hand", type: "ASSET" },
  { code: ACCOUNT_CODES.BANK, name: "Bank", type: "ASSET" },
  { code: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, name: "Accounts Receivable", type: "ASSET" },
  { code: ACCOUNT_CODES.INVENTORY, name: "Inventory", type: "ASSET" },
  { code: ACCOUNT_CODES.ACCOUNTS_PAYABLE, name: "Accounts Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.VAT_OUTPUT_PAYABLE, name: "VAT Output Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.PAYE_PAYABLE, name: "PAYE Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.NSSA_PAYABLE, name: "NSSA Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.NEC_PAYABLE, name: "NEC Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.AIDS_PAYABLE, name: "AIDS Levy Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.SALARIES_PAYABLE, name: "Salaries Payable", type: "LIABILITY" },
  { code: ACCOUNT_CODES.RETAINED_EARNINGS, name: "Retained Earnings", type: "EQUITY" },
  { code: ACCOUNT_CODES.OWNERS_CAPITAL, name: "Owner's Capital", type: "EQUITY" },
  { code: ACCOUNT_CODES.SALES_REVENUE, name: "Sales Revenue", type: "INCOME" },
  { code: ACCOUNT_CODES.COST_OF_GOODS_SOLD, name: "Cost of Goods Sold", type: "EXPENSE" },
  { code: ACCOUNT_CODES.SALARIES_EXPENSE, name: "Salaries & Wages Expense", type: "EXPENSE" },
  { code: ACCOUNT_CODES.GENERAL_EXPENSE, name: "General Expense", type: "EXPENSE" },
];

/**
 * Resolve a system account by its well-known code. Throws if a tenant's
 * chart of accounts is missing an account that posting rules depend on.
 */
export async function getAccount(
  tx: Prisma.TransactionClient,
  tenantId: string,
  code: string
) {
  const account = await tx.ledgerAccount.findUnique({
    where: { tenantId_code: { tenantId, code } },
  });
  if (!account) {
    throw new Error(
      `Ledger account ${code} not found for tenant ${tenantId} — chart of accounts may be incomplete.`
    );
  }
  return account;
}
