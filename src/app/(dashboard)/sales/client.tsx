"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, AlertTriangle, ArrowUpRight, DollarSign, FileText } from "lucide-react";
import Link from "next/link";

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  total: number;
  status: string;
  issueDate: string;
  balanceDue: number;
  currency: { code: string; symbol: string };
}

interface SalesWorkspaceProps {
  metrics: {
    openInvoices: number;
    overdueInvoices: number;
    monthlyRevenue: number;
  };
  recentInvoices: RecentInvoice[];
}

function getStatusBadge(status: string) {
  const variants: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    FISCAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return variants[status] || "bg-muted text-muted-foreground";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SalesWorkspace({ metrics, recentInvoices }: SalesWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage invoices, customers, and track revenue.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.overdueInvoices > 0 ? "text-red-600" : ""}`}>
              {metrics.overdueInvoices}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">30-Day Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.monthlyRevenue.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total invoiced (30 days)</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href="/sales/invoices/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
            <Link
              href="/sales/invoices"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <FileText className="h-4 w-4" />
              View All Invoices
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.overdueInvoices > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <span>
                  <strong>{metrics.overdueInvoices} invoice(s)</strong> are past due.{" "}
                  <Link href="/sales/invoices?status=OVERDUE" className="text-primary hover:underline">
                    Review now
                  </Link>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No overdue invoices. All payments on track.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
          <Link
            href="/sales/invoices"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
          >
            View all
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
              <Link
                href="/sales/invoices/new"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-7 gap-1 rounded-[min(var(--radius-md),12px)] text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none mt-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Invoice
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/sales/invoices/${inv.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-md transition-colors -mx-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{inv.customer.name}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {inv.currency.symbol}{inv.total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</p>
                    </div>
                    <Badge variant="outline" className={getStatusBadge(inv.status)}>
                      {inv.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
