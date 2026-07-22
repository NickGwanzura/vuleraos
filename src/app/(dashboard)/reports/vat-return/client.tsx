"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

const USD = { code: "USD", symbol: "$" };

interface VatReturnData {
  period: { from: string; to: string };
  outputVat: {
    count: number;
    totalValue: number;
    totalVat: number;
    invoices: any[];
  };
  inputVat: {
    count: number;
    totalValue: number;
    totalVat: number;
    orders: any[];
  };
  summary: {
    outputVatDue: number;
    inputVatDeductible: number;
    netVatDue: number;
  };
}

export function VATReturnReport() {
  const [from, setFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<VatReturnData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/vat-return?from=${from}&to=${to}`
      );
      if (!res.ok) { toast.error("Failed to load report"); return; }
      setData(await res.json());
    } catch { toast.error("An error occurred"); }
    finally { setLoading(false); }
  }

  async function downloadCSV() {
    try {
      const res = await fetch(
        `/api/reports/vat-return?from=${from}&to=${to}&format=csv`
      );
      if (!res.ok) { toast.error("Failed to download"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vat-return-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded");
    } catch { toast.error("An error occurred"); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">VAT Return</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ZIMRA VAT return report for the selected period
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
            <Button onClick={loadReport} disabled={loading}>
              <Search className="h-4 w-4 mr-1" />{loading ? "Loading..." : "Generate Report"}
            </Button>
            {data && (
              <Button variant="outline" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-1" /> Download CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Output VAT (Sales)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.summary.outputVatDue, USD)}</p>
                <p className="text-xs text-muted-foreground">{data.outputVat.count} invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Input VAT (Purchases)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.inputVatDeductible, USD)}</p>
                <p className="text-xs text-muted-foreground">{data.inputVat.count} orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Net VAT Due</CardTitle></CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${data.summary.netVatDue > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(data.summary.netVatDue, USD)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Period: {new Date(data.period.from).toLocaleDateString("en-ZW")} — {new Date(data.period.to).toLocaleDateString("en-ZW")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Output VAT Detail */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Output VAT — Sales Invoices</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>BP Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">VAT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.outputVat.invoices.map((inv: any) => (
                    <TableRow key={inv.invoiceNumber}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell className="text-xs font-mono">{inv.customerBP || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.issueDate).toLocaleDateString("en-ZW")}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.total, USD)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(inv.vatAmount, USD)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary totals */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Output VAT</span>
                    <span className="font-medium">{formatCurrency(data.summary.outputVatDue, USD)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Less Input VAT</span>
                    <span className="font-medium">({formatCurrency(data.summary.inputVatDeductible, USD)})</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-1">
                    <span>Net VAT Payable</span>
                    <span className={data.summary.netVatDue > 0 ? "text-red-600" : "text-green-600"}>
                      {formatCurrency(data.summary.netVatDue, USD)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Select a period and generate the VAT return report.</p>
        </div>
      )}
    </div>
  );
}
