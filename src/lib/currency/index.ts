/**
 * Currency utility for VuleraOS.
 * Handles dual-currency display, conversion, and formatting for Zimbabwe.
 */

export interface CurrencyInfo {
  code: string;
  symbol: string;
  isBase: boolean;
}

export interface ExchangeRateInfo {
  rate: number;
  parallelMarketRate: number | null;
  isManualOverride: boolean;
}

/**
 * Format an amount in the given currency.
 * USD: $1,234.56
 * ZWG: ZiG 1,234.56
 */
export function formatCurrency(
  amount: number,
  currency: { code: string; symbol: string } | null | undefined
): string {
  const formatted = amount.toLocaleString("en-ZW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!currency) return `$${formatted}`;

  if (currency.code === "USD") {
    return `${currency.symbol}${formatted}`;
  }

  // ZWG and others
  return `${currency.symbol} ${formatted}`;
}

/**
 * Convert an amount from one currency to another using the exchange rate.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number | null | undefined
): { amount: number; rate: number } | null {
  if (!rate || rate <= 0) return null;
  if (fromCurrency === toCurrency) return { amount, rate: 1 };

  const converted = amount * rate;
  return { amount: converted, rate };
}

/**
 * Get the equivalent in the other primary currency (USD ↔ ZWG).
 * Returns both values for side-by-side display.
 */
export function getDualDisplay(
  amount: number,
  currencyCode: string,
  exchangeRate: { rate: number | null; parallelMarketRate?: number | null } | null | undefined
): { primary: string; secondary: string | null } {
  const primary = formatCurrency(amount, { code: currencyCode, symbol: currencyCode === "USD" ? "$" : "ZiG" });
  
  if (!exchangeRate?.rate) {
    return { primary, secondary: null };
  }

  const rate = exchangeRate.rate;
  let converted: number;
  let targetCurrency: string;

  if (currencyCode === "USD") {
    converted = amount * rate;
    targetCurrency = "ZWG";
  } else if (currencyCode === "ZWG") {
    converted = amount / rate;
    targetCurrency = "USD";
  } else {
    return { primary, secondary: null };
  }

  const secondary = formatCurrency(converted, {
    code: targetCurrency,
    symbol: targetCurrency === "USD" ? "$" : "ZiG",
  });

  return { primary, secondary };
}

/**
 * Common Zimbabwean bank list for dropdown selectors.
 */
export const ZIMBABWEAN_BANKS = [
  "CBZ Bank",
  "Stanbic Bank",
  "Nedbank Zimbabwe",
  "FBC Bank",
  "Zanaco",
  "ZABG",
  "NBS Bank",
  "Ecobank Zimbabwe",
  "Standard Chartered Zimbabwe",
  "First Capital Bank",
  "African Century Bank",
  "POSB",
  "Metbank",
  "CABS",
  "Agribank",
] as const;

/**
 * Mobile money prefixes for reference validation.
 */
export const MOBILE_MONEY_PREFIXES = {
  ECOCASH: "EC",
  ONEMONEY: "OM",
} as const;

/**
 * Format a payment method for display.
 */
export function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    ECOCASH: "EcoCash",
    ONEMONEY: "OneMoney",
    RTGS: "RTGS Transfer",
    BANK_TRANSFER: "Bank Transfer",
    CASH: "Cash",
    OTHER: "Other",
  };
  return labels[method] || method;
}

/**
 * Inflation-adjusted value: restates a historical amount in today's currency equivalent.
 */
export function calculateInflationAdjustedValue(
  historicalAmount: number,
  historicalRate: number | null | undefined,
  currentRate: number | null | undefined
): { originalValue: number; currentValue: number; adjustmentPercent: number } | null {
  if (!historicalRate || !currentRate || historicalRate <= 0 || currentRate <= 0) return null;
  const currentValue = historicalAmount * (currentRate / historicalRate);
  const adjustmentPercent = ((currentValue - historicalAmount) / historicalAmount) * 100;
  return {
    originalValue: historicalAmount,
    currentValue: Math.round(currentValue * 100) / 100,
    adjustmentPercent: Math.round(adjustmentPercent * 100) / 100,
  };
}

/**
 * Generate a dual-currency summary with inflation adjustment across transactions.
 */
export function generateInflationAdjustedSummary(
  transactions: { amount: number; date: string; rateAtDate: number | null }[],
  currentRate: number | null
): { unadjustedTotal: number; adjustedTotal: number; realChangePercent: number } {
  let unadjustedTotal = 0;
  let adjustedTotal = 0;
  for (const tx of transactions) {
    unadjustedTotal += tx.amount;
    if (tx.rateAtDate && currentRate) {
      const adj = calculateInflationAdjustedValue(tx.amount, tx.rateAtDate, currentRate);
      adjustedTotal += adj ? adj.currentValue : tx.amount;
    } else {
      adjustedTotal += tx.amount;
    }
  }
  const realChangePercent = unadjustedTotal > 0
    ? Math.round(((adjustedTotal - unadjustedTotal) / unadjustedTotal) * 10000) / 100
    : 0;
  return {
    unadjustedTotal: Math.round(unadjustedTotal * 100) / 100,
    adjustedTotal: Math.round(adjustedTotal * 100) / 100,
    realChangePercent,
  };
}
