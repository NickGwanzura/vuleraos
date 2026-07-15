"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Package,
  DollarSign,
  TrendingUp,
  Plus,
  ShoppingCart,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  total: number;
  status: string;
  issueDate: string;
  currency: { code: string; symbol: string };
}

interface DashboardClientProps {
  userName: string;
  metrics: {
    openInvoices: number;
    lowStockItems: number;
    pendingPayments: number;
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

export function DashboardClient({
  userName,
  metrics,
  recentInvoices,
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Open Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {metrics.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need replenishment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Unreconciled Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingPayments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting matching
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Quick Actions
            </CardTitle>
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
              href="/stock/items/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <Plus className="h-4 w-4" />
              New Stock Item
            </Link>
            <Link
              href="/buying/purchase-orders/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <ShoppingCart className="h-4 w-4" />
              New Purchase Order
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.lowStockItems > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <span>
                  <strong>{metrics.lowStockItems} item(s)</strong> are below
                  minimum stock levels.{" "}
                  <Link
                    href="/stock"
                    className="text-primary hover:underline"
                  >
                    Review stock
                  </Link>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No alerts. Everything looks good.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Recent Invoices
          </CardTitle>
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
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No invoices yet. Create your first one to get started.
              </p>
              <Link
                href="/sales/invoices/new"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-7 gap-1 rounded-[min(var(--radius-md),12px)] text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none mt-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Invoice
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/sales/invoices/${inv.id}`}
                        className="hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(inv.issueDate)}
                    </TableCell>
                    <TableCell>
                      {inv.currency.symbol}
                      {inv.total.toLocaleString("en-ZW", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusBadge(inv.status)}
                      >
                        {inv.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
