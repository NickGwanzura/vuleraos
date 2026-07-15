"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Plus, ArrowUpRight, FileText, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

interface RecentPO {
  id: string;
  poNumber: string;
  supplier: { name: string };
  total: number;
  status: string;
  orderDate: string;
  currency: { code: string; symbol: string };
}

interface BuyingWorkspaceProps {
  metrics: {
    openPOs: number;
    pendingApproval: number;
    monthlyProcurement: number;
  };
  recentPOs: RecentPO[];
}

function getStatusBadge(status: string): string {
  const variants: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200",
    PARTIALLY_RECEIVED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-200",
    RECEIVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200",
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

export function BuyingWorkspace({ metrics, recentPOs }: BuyingWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buying</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage purchase orders, suppliers, and procurement.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.openPOs}</div>
            <p className="text-xs text-muted-foreground mt-1">Not yet received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.pendingApproval > 0 ? "text-yellow-600" : ""}`}>
              {metrics.pendingApproval}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">30-Day Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.monthlyProcurement.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Approved orders (30 days)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href="/buying/purchase-orders/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <Plus className="h-4 w-4" />
              New Purchase Order
            </Link>
            <Link
              href="/buying/purchase-orders"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <FileText className="h-4 w-4" />
              View All Orders
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.pendingApproval > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span>
                  <strong>{metrics.pendingApproval} order(s)</strong> need approval.{" "}
                  <Link href="/buying/purchase-orders?status=PENDING_APPROVAL" className="text-primary hover:underline">
                    Review now
                  </Link>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders pending approval.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Purchase Orders</CardTitle>
          <Link
            href="/buying/purchase-orders"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentPOs.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
              <Link
                href="/buying/purchase-orders/new"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-7 gap-1 rounded-[min(var(--radius-md),12px)] text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none mt-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Purchase Order
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentPOs.map((po) => (
                <Link
                  key={po.id}
                  href={`/buying/purchase-orders/${po.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-md transition-colors -mx-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{po.poNumber}</p>
                    <p className="text-xs text-muted-foreground">{po.supplier.name}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {po.currency.symbol}{po.total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(po.orderDate)}</p>
                    </div>
                    <Badge variant="outline" className={getStatusBadge(po.status)}>
                      {po.status.replace("_", " ")}
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
