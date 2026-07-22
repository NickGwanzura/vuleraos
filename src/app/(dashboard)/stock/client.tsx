"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, AlertTriangle, ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

interface RecentItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStock: number | null;
  defaultPrice: number | null;
  category: { name: string } | null;
  currency: { code: string; symbol: string } | null;
}

interface StockWorkspaceProps {
  metrics: {
    totalItems: number;
    lowStockCount: number;
  };
  recentItems: RecentItem[];
}

export function StockWorkspace({ metrics, recentItems }: StockWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage inventory items, stock levels, and movements.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Active stock items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics.lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Below minimum level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/stock/items" className="text-primary hover:underline">Manage items</Link>
            </p>
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
              href="/stock/items/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <Plus className="h-4 w-4" />
              New Item
            </Link>
            <Link
              href="/stock/items"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <FileText className="h-4 w-4" />
              View All Items
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.lowStockCount > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <span>
                  <strong>{metrics.lowStockCount} item(s)</strong> are below minimum
                  stock levels.{" "}
                  <Link href="/stock/items?lowStock=true" className="text-primary hover:underline">
                    Review now
                  </Link>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All items have sufficient stock.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Items</CardTitle>
          <Link
            href="/stock/items"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
          >
            View all
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No items yet. Create your first stock item.
              </p>
              <Link
                href="/stock/items/new"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-7 gap-1 rounded-[min(var(--radius-md),12px)] text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none mt-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Item
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/stock/items/${item.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-md transition-colors -mx-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sku} {item.category ? `• ${item.category.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {item.currentStock}
                      </p>
                      <p className="text-xs text-muted-foreground">in stock</p>
                    </div>
                    {item.minimumStock !== null &&
                      item.currentStock <= item.minimumStock && (
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 border-amber-200"
                        >
                          Low
                        </Badge>
                      )}
                    {item.defaultPrice !== null && (
                      <div className="text-right hidden sm:block">
                        <p className="text-sm">
                          {formatCurrency(item.defaultPrice, item.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">price</p>
                      </div>
                    )}
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
