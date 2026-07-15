"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, ArrowUpDown, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { id: string; name: string };
  total: number;
  status: string;
  issueDate: string;
  dueDate: string;
  balanceDue: number;
  amountPaid: number;
  currency: { code: string; symbol: string };
}

interface InvoiceListProps {
  invoices: Invoice[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "FISCAL", label: "Fiscal" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

function getStatusBadge(status: string): string {
  const variants: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    FISCAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200",
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

type SortField = "invoiceNumber" | "issueDate" | "total" | "balanceDue" | "customer";
type SortDir = "asc" | "desc";

export function InvoiceList({ invoices }: InvoiceListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("issueDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customer.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "invoiceNumber":
          cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case "issueDate":
          cmp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
          break;
        case "total":
          cmp = a.total - b.total;
          break;
        case "balanceDue":
          cmp = a.balanceDue - b.balanceDue;
          break;
        case "customer":
          cmp = a.customer.name.localeCompare(b.customer.name);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [invoices, search, statusFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return <ArrowUpDown className="h-3 w-3" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/sales/invoices/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice # or customer..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
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
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("invoiceNumber")}>
                  <div className="flex items-center gap-1">Invoice # {renderSortIcon("invoiceNumber")}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("customer")}>
                  <div className="flex items-center gap-1">Customer {renderSortIcon("customer")}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground" onClick={() => toggleSort("issueDate")}>
                  <div className="flex items-center gap-1">Date {renderSortIcon("issueDate")}</div>
                </TableHead>
                <TableHead className="cursor-pointer hover:text-foreground text-right" onClick={() => toggleSort("total")}>
                  <div className="flex items-center justify-end gap-1">Amount {renderSortIcon("total")}</div>
                </TableHead>
                <TableHead className="text-right hidden md:table-cell">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter !== "all"
                        ? "No invoices match your filters."
                        : "No invoices yet. Create your first invoice."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/sales/invoices/${inv.id}`)}
                  >
                    <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(inv.issueDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {inv.currency.symbol}{inv.total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-600">
                          {inv.currency.symbol}{inv.balanceDue.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-green-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(inv.status)}>
                        {inv.status.replace("_", " ")}
                      </Badge>
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
