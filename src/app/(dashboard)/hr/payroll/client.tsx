"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, ArrowUpRight, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PayrollRun {
  id: string; periodStart: string; periodEnd: string; status: string;
  totalGross: number; totalDeductions: number; totalNet: number;
  currency: { code: string; symbol: string };
  processedBy: { name: string };
  _count: { items: number };
}

interface PayrollListProps { runs: PayrollRun[] }

function getStatusBadge(status: string): string {
  const m: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PROCESSED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return m[status] || "bg-muted text-muted-foreground";
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start); const e = new Date(end);
  return `${s.toLocaleDateString("en-ZW", { month: "short", year: "numeric" })}`;
}

export function PayrollList({ runs }: PayrollListProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function handleRunPayroll() {
    setRunning(true);
    try {
      const res = await fetch("/api/hr/payroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      const r = await res.json();
      toast.success(`Payroll created for ${formatPeriod(r.periodStart, r.periodEnd)}`);
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setRunning(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Payroll</h1><p className="text-sm text-muted-foreground">{runs.length} run{runs.length !== 1 ? "s" : ""}</p></div>
        <Button onClick={handleRunPayroll} disabled={running}>
          <Plus className="h-4 w-4 mr-1" />{running ? "Running..." : "Run Payroll"}
        </Button>
      </div>

      <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
        <TableHead>Period</TableHead>
        <TableHead className="text-right">Employees</TableHead>
        <TableHead className="text-right">Gross</TableHead>
        <TableHead className="text-right">Deductions</TableHead>
        <TableHead className="text-right">Net Pay</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>By</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {runs.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-12"><DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No payroll runs yet. Run your first payroll.</p></TableCell></TableRow>
        : runs.map(r => <TableRow key={r.id} className="cursor-pointer" onClick={() => router.push(`/hr/payroll/${r.id}`)}>
          <TableCell className="font-medium">{formatPeriod(r.periodStart, r.periodEnd)}</TableCell>
          <TableCell className="text-right">{r._count.items}</TableCell>
          <TableCell className="text-right">{r.currency.symbol}{r.totalGross.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</TableCell>
          <TableCell className="text-right text-red-500">({r.currency.symbol}{r.totalDeductions.toLocaleString("en-ZW", { minimumFractionDigits: 2 })})</TableCell>
          <TableCell className="text-right font-medium">{r.currency.symbol}{r.totalNet.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</TableCell>
          <TableCell><Badge variant="outline" className={getStatusBadge(r.status)}>{r.status}</Badge></TableCell>
          <TableCell className="text-xs text-muted-foreground">{r.processedBy.name}</TableCell>
        </TableRow>)}
      </TableBody></Table></CardContent></Card>
    </div>
  );
}
