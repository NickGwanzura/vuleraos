"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";

interface MonthData { month: string; revenue: number; adjustedRevenue: number; adjustmentPercent: number; count: number; rate: number | null; }

export function InflationAdjustedReport() {
  const [months, setMonths] = useState(12);
  const [data, setData] = useState<{
    months: MonthData[];
    currentRate: number | null;
    totals: { unadjustedRevenue: number; adjustedRevenue: number };
    stockValuation: { items: { name: string; stock: number; unitValue: number; totalValue: number }[]; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/inflation-adjusted?months=${months}`);
      if (!res.ok) { toast.error("Failed to load"); return; }
      setData(await res.json());
    } catch { toast.error("An error occurred"); }
    finally { setLoading(false); }
  }

  const formatCurrency = (n: number) => `$${n.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inflation-Adjusted Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Restate revenue and values accounting for currency movement.</p>
      </div>

      <Card><CardContent className="pt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Lookback Period</label>
            <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
              <option value={24}>24 months</option>
            </select>
          </div>
          <Button onClick={loadReport} disabled={loading}><Search className="h-4 w-4 mr-1" />{loading ? "Loading..." : "Generate Report"}</Button>
        </div>
      </CardContent></Card>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Unadjusted Revenue</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{formatCurrency(data.totals.unadjustedRevenue)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Inflation-Adjusted</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold text-amber-600">{formatCurrency(data.totals.adjustedRevenue)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Real Change</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const pct = data.totals.unadjustedRevenue > 0
                    ? ((data.totals.adjustedRevenue - data.totals.unadjustedRevenue) / data.totals.unadjustedRevenue * 100)
                    : 0;
                  return <p className={`text-xl font-bold flex items-center gap-1 ${pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {pct >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {pct.toFixed(1)}%
                  </p>;
                })()}
              </CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Current Rate</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{data.currentRate?.toFixed(4) || "—"}</p>
                <p className="text-xs text-muted-foreground">USD → ZWG</p></CardContent></Card>
          </div>

          <Card><CardHeader><CardTitle className="text-sm">Monthly Revenue Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Nominal Revenue</TableHead>
                <TableHead className="text-right">Inflation-Adjusted</TableHead>
                <TableHead className="text-right">Real Change</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.months.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">{new Date(m.month + "-01").toLocaleDateString("en-ZW", { month: "long", year: "numeric" })}</TableCell>
                    <TableCell className="text-right">{m.count}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{m.rate?.toFixed(4) || "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.revenue)}</TableCell>
                    <TableCell className="text-right text-amber-600">{formatCurrency(m.adjustedRevenue)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={m.adjustmentPercent >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {m.adjustmentPercent >= 0 ? "+" : ""}{m.adjustmentPercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Stock Valuation</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow>
                <TableHead>Item</TableHead><TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Unit Value</TableHead><TableHead className="text-right">Total Value</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.stockValuation.items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{item.stock}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitValue)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.totalValue)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/30">
                  <TableCell colSpan={3}>Total Stock Value</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.stockValuation.total)}</TableCell>
                </TableRow>
              </TableBody></Table>
            </CardContent></Card>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-16">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Select a period and generate the inflation-adjusted report.</p>
        </div>
      )}
    </div>
  );
}
