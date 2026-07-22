"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import {
  BookOpen,
  Plus,
  ArrowUpRight,
  DollarSign,
  AlertTriangle,
  Banknote,
  ArrowLeftRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface RecentPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  isReconciled: boolean;
  referenceNumber: string | null;
  receivedAt: string;
  invoice: { invoiceNumber: string; customer: { name: string } } | null;
  currency: { code: string; symbol: string };
}

interface AccountingWorkspaceProps {
  metrics: {
    unreconciled: number;
    arTotal: number;
    apTotal: number;
  };
  recentPayments: RecentPayment[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

export function AccountingWorkspace({ metrics, recentPayments }: AccountingWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Payments, reconciliation, and financial overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.arTotal.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Accounts Payable</CardTitle>
            <Banknote className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.apTotal.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unreconciled</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.unreconciled > 0 ? "text-red-600" : ""}`}>{metrics.unreconciled}</div>
            <p className="text-xs text-muted-foreground mt-1">Payments needing matching</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/accounting/payments/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <Plus className="h-4 w-4" /> Record Payment
            </Link>
            <Link href="/accounting/reconciliation"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <ArrowLeftRight className="h-4 w-4" /> Reconciliation
            </Link>
            <Link href="/accounting/payments"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <BookOpen className="h-4 w-4" /> View All Payments
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Alerts</CardTitle></CardHeader>
          <CardContent>
            {metrics.unreconciled > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <span><strong>{metrics.unreconciled} payment(s)</strong> need reconciliation.{" "}
                  <Link href="/accounting/reconciliation" className="text-primary hover:underline">Match now</Link>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All payments are reconciled.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
          <Link href="/accounting/payments"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.invoice ? p.invoice.invoiceNumber : "Unlinked"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.invoice?.customer.name || "—"} • {p.paymentMethod.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(p.amount, p.currency)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.receivedAt)}</p>
                    </div>
                    {p.isReconciled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
