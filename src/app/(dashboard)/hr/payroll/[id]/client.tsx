"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle, DollarSign, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PayrollItem {
  id: string; grossPay: number; payeTax: number; nssaDeduction: number;
  necDeduction: number; aidDeduction: number; otherDeductions: number;
  totalDeductions: number; netPay: number;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string; department: string | null; position: string | null; bankName: string | null; bankAccount: string | null; nssaNumber: string | null; taxIdNumber: string | null };
  currency: { code: string; symbol: string };
}

interface PayrollDetailData {
  id: string; periodStart: string; periodEnd: string; status: string;
  totalGross: number; totalDeductions: number; totalNet: number;
  totalPaye: number; totalNssa: number; totalNec: number; totalAid: number;
  currency: { code: string; symbol: string };
  processedBy: { name: string };
  notes: string | null;
  items: PayrollItem[];
}

interface PayrollDetailProps { payroll: PayrollDetailData }

function getStatusBadge(status: string): string {
  const m: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PROCESSED: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return m[status] || "bg-muted text-muted-foreground";
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start); const e = new Date(end);
  return `${s.toLocaleDateString("en-ZW", { month: "long", day: "numeric", year: "numeric" })} — ${e.toLocaleDateString("en-ZW", { month: "long", day: "numeric", year: "numeric" })}`;
}

function formatCurrency(n: number, symbol: string) {
  return `${symbol}${n.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}`;
}

export function PayrollDetail({ payroll }: PayrollDetailProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  async function handleProcess() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/hr/payroll/${payroll.id}/process`, { method: "PUT" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Payroll processed");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setProcessing(false); }
  }

  async function handleMarkPaid() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/hr/payroll/${payroll.id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAID" }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Payroll marked as paid");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setProcessing(false); }
  }

  const sym = payroll.currency.symbol;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/hr/payroll" className="text-muted-foreground hover:text-foreground mt-1"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
              <Badge variant="outline" className={getStatusBadge(payroll.status)}>{payroll.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formatPeriod(payroll.periodStart, payroll.periodEnd)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {payroll.status === "DRAFT" && <Button onClick={handleProcess} disabled={processing}>{processing ? "Processing..." : "Process Payroll"}</Button>}
          {payroll.status === "PROCESSED" && <Button onClick={handleMarkPaid} disabled={processing}><CheckCircle className="h-4 w-4 mr-1" />Mark as Paid</Button>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Gross</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(payroll.totalGross, sym)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Deductions</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-red-600">({formatCurrency(payroll.totalDeductions, sym)})</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Net Pay</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-green-600">{formatCurrency(payroll.totalNet, sym)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Employees</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{payroll.items.length}</p></CardContent></Card>
      </div>

      {/* Tax Breakdown */}
      <Card><CardHeader><CardTitle className="text-sm">Tax Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 max-w-lg">
            <div><p className="text-xs text-muted-foreground">PAYE</p><p className="font-medium">{formatCurrency(payroll.totalPaye, sym)}</p></div>
            <div><p className="text-xs text-muted-foreground">NSSA</p><p className="font-medium">{formatCurrency(payroll.totalNssa, sym)}</p></div>
            <div><p className="text-xs text-muted-foreground">NEC</p><p className="font-medium">{formatCurrency(payroll.totalNec, sym)}</p></div>
            <div><p className="text-xs text-muted-foreground">AID</p><p className="font-medium">{formatCurrency(payroll.totalAid, sym)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Per-employee breakdown */}
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
        <TableHead>Employee</TableHead>
        <TableHead>Code</TableHead>
        <TableHead className="text-right">Gross</TableHead>
        <TableHead className="text-right">PAYE</TableHead>
        <TableHead className="text-right">NSSA</TableHead>
        <TableHead className="text-right">NEC</TableHead>
        <TableHead className="text-right">AID</TableHead>
        <TableHead className="text-right">Deductions</TableHead>
        <TableHead className="text-right font-bold">Net Pay</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {payroll.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.employee.firstName} {item.employee.lastName}</TableCell>
            <TableCell className="font-mono text-xs">{item.employee.employeeCode}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.grossPay, sym)}</TableCell>
            <TableCell className="text-right text-red-500">{formatCurrency(item.payeTax, sym)}</TableCell>
            <TableCell className="text-right text-red-500">{formatCurrency(item.nssaDeduction, sym)}</TableCell>
            <TableCell className="text-right text-red-500">{formatCurrency(item.necDeduction, sym)}</TableCell>
            <TableCell className="text-right text-red-500">{formatCurrency(item.aidDeduction, sym)}</TableCell>
            <TableCell className="text-right text-red-500">({formatCurrency(item.totalDeductions, sym)})</TableCell>
            <TableCell className="text-right font-bold text-green-600">{formatCurrency(item.netPay, sym)}</TableCell>
          </TableRow>
        ))}
        {/* Totals row */}
        <TableRow className="font-bold bg-muted/30">
          <TableCell colSpan={2}>Totals</TableCell>
          <TableCell className="text-right">{formatCurrency(payroll.totalGross, sym)}</TableCell>
          <TableCell className="text-right">{formatCurrency(payroll.totalPaye, sym)}</TableCell>
          <TableCell className="text-right">{formatCurrency(payroll.totalNssa, sym)}</TableCell>
          <TableCell className="text-right">{formatCurrency(payroll.totalNec, sym)}</TableCell>
          <TableCell className="text-right">{formatCurrency(payroll.totalAid, sym)}</TableCell>
          <TableCell className="text-right">({formatCurrency(payroll.totalDeductions, sym)})</TableCell>
          <TableCell className="text-right text-green-600">{formatCurrency(payroll.totalNet, sym)}</TableCell>
        </TableRow>
      </TableBody></Table></CardContent></Card>
    </div>
  );
}
