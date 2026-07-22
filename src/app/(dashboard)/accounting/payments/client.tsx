"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, ArrowUpDown, BookOpen, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  isReconciled: boolean;
  referenceNumber: string | null;
  receivedAt: string;
  bankName: string | null;
  notes: string | null;
  invoice: { id: string; invoiceNumber: string; customer: { name: string } } | null;
  currency: { code: string; symbol: string };
  createdBy: { name: string };
}

interface PaymentListProps {
  payments: Payment[];
}

const METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  { value: "ECOCASH", label: "EcoCash" },
  { value: "ONEMONEY", label: "OneMoney" },
  { value: "RTGS", label: "RTGS" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

type SortField = "receivedAt" | "amount" | "paymentMethod";
type SortDir = "asc" | "desc";

export function PaymentList({ payments }: PaymentListProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [reconciledFilter, setReconciledFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("receivedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let result = [...payments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.invoice?.invoiceNumber || "").toLowerCase().includes(q) ||
          (p.invoice?.customer.name || "").toLowerCase().includes(q) ||
          (p.referenceNumber || "").toLowerCase().includes(q)
      );
    }
    if (methodFilter !== "all") result = result.filter((p) => p.paymentMethod === methodFilter);
    if (reconciledFilter === "reconciled") result = result.filter((p) => p.isReconciled);
    if (reconciledFilter === "unreconciled") result = result.filter((p) => !p.isReconciled);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "receivedAt": cmp = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(); break;
        case "amount": cmp = a.amount - b.amount; break;
        case "paymentMethod": cmp = a.paymentMethod.localeCompare(b.paymentMethod); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [payments, search, methodFilter, reconciledFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">{payments.length} payment{payments.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/accounting/payments/new">
          <Button><Plus className="h-4 w-4 mr-1" /> Record Payment</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by invoice, customer, or reference..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v ?? "all")}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>{METHOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={reconciledFilter} onValueChange={(v) => setReconciledFilter(v ?? "all")}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
                <SelectItem value="unreconciled">Unreconciled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("receivedAt")}>
                  <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("amount")}>
                  <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No payments found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(p.receivedAt)}</TableCell>
                    <TableCell className="font-medium">{p.invoice?.invoiceNumber || "—"}</TableCell>
                    <TableCell>{p.invoice?.customer.name || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.paymentMethod.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.referenceNumber || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(p.amount, p.currency)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {p.isReconciled ? (
                          <><CheckCircle className="h-3.5 w-3.5 text-green-500" /><span className="text-xs text-green-600">Matched</span></>
                        ) : (
                          <><XCircle className="h-3.5 w-3.5 text-amber-500" /><span className="text-xs text-amber-600">Unmatched</span></>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
