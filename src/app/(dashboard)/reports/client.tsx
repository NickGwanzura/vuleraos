"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scale, Landmark, TrendingUp, BookText, Receipt, LineChart, Banknote } from "lucide-react";

const reports = [
  {
    href: "/reports/trial-balance",
    title: "Trial Balance",
    description: "Every posted debit and credit, as of a date. Should always balance.",
    icon: Scale,
  },
  {
    href: "/reports/balance-sheet",
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity as of a date.",
    icon: Landmark,
  },
  {
    href: "/reports/income-statement",
    title: "Income Statement",
    description: "Income and expenses between two dates.",
    icon: TrendingUp,
  },
  {
    href: "/reports/journal-entries",
    title: "Journal Entries",
    description: "Every entry posted to the ledger, with drill-down detail.",
    icon: BookText,
  },
  {
    href: "/reports/currency-exposure",
    title: "Currency Exposure",
    description: "Foreign-currency balances translated at today's rate vs. the rate posted.",
    icon: Banknote,
  },
  {
    href: "/reports/vat-return",
    title: "VAT Return",
    description: "Output VAT due for a filing period.",
    icon: Receipt,
  },
  {
    href: "/reports/inflation-adjusted",
    title: "Inflation-Adjusted",
    description: "Revenue and stock value restated for currency volatility.",
    icon: LineChart,
  },
];

export function ReportsWorkspace() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and generate business reports and analytics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <report.icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
