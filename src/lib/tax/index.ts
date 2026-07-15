/**
 * Zimbabwe tax calculations for payroll processing.
 * Rates based on 2025 ZIMRA tax tables.
 */

export interface PayrollDeductions {
  grossPay: number;
  payeTax: number;
  nssaDeduction: number;
  necDeduction: number;
  aidDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
}

/**
 * PAYE (Pay As You Earn) calculation.
 * 2025 ZIMRA tax brackets for monthly taxable income in ZWG.
 */
export function calculatePAYE(monthlyTaxableIncome: number): number {
  if (monthlyTaxableIncome <= 0) return 0;

  const brackets = [
    { min: 0, max: 100_000, rate: 0 },
    { min: 100_001, max: 300_000, rate: 0.20 },
    { min: 300_001, max: 600_000, rate: 0.25 },
    { min: 600_001, max: 1_200_000, rate: 0.30 },
    { min: 1_200_001, max: 2_400_000, rate: 0.35 },
    { min: 2_400_001, max: Infinity, rate: 0.40 },
  ];

  let tax = 0;
  let remaining = monthlyTaxableIncome;

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, bracket.max - bracket.min + 1);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
  }

  return Math.round(tax * 100) / 100; // Round to 2 decimal places
}

/**
 * NSSA (National Social Security Authority) calculation.
 * Employee contribution: 3.5% of insurable earnings, capped.
 */
export function calculateNSSA(grossPay: number): number {
  const NSSA_RATE = 0.035;
  const NSSA_CEILING = 10_000; // Monthly ceiling in ZWG
  const insurableEarnings = Math.min(grossPay, NSSA_CEILING);
  return Math.round(insurableEarnings * NSSA_RATE * 100) / 100;
}

/**
 * NEC (National Employment Council) calculation.
 * Varies by sector — defaulting to 3% of basic salary.
 */
export function calculateNEC(grossPay: number): number {
  const NEC_RATE = 0.03;
  return Math.round(grossPay * NEC_RATE * 100) / 100;
}

/**
 * AID (AIDS Levy) calculation.
 * 3% of gross pay (standard Zimbabwean levy).
 */
export function calculateAID(grossPay: number): number {
  const AID_RATE = 0.03;
  return Math.round(grossPay * AID_RATE * 100) / 100;
}

/**
 * Calculate all payroll deductions for a single employee.
 */
export function calculatePayrollDeductions(grossPay: number): PayrollDeductions {
  const payeTax = calculatePAYE(grossPay);
  const nssaDeduction = calculateNSSA(grossPay);
  const necDeduction = calculateNEC(grossPay);
  const aidDeduction = calculateAID(grossPay);
  const otherDeductions = 0;
  const totalDeductions = payeTax + nssaDeduction + necDeduction + aidDeduction + otherDeductions;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    grossPay,
    payeTax,
    nssaDeduction,
    necDeduction,
    aidDeduction,
    otherDeductions,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
  };
}

/**
 * Format a payslip number.
 */
export function generatePayslipNumber(employeeCode: string, periodStart: Date): string {
  const year = periodStart.getFullYear();
  const month = String(periodStart.getMonth() + 1).padStart(2, "0");
  return `PS-${employeeCode}-${year}${month}`;
}
