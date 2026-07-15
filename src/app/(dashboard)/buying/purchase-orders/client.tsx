"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Search, ArrowUpDown, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface PO {
  id: string;
  poNumber: string;
  supplier: { id: string; name: string };
  total: number;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  currency: { code: string; symbol: string };
  createdBy: { name: string };
}

interface POListProps {
  orders: PO[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "PARTIALLY_RECEIVED", label: "Partially Received" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

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
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

type SortField = "poNumber" | "orderDate" | "total" | "supplier";
type SortDir = "asc" | "desc";

export function POList({ orders }: POListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("orderDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(q) ||
          po.supplier.name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((po) => po.status === statusFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "poNumber": cmp = a.poNumber.localeCompare(b.poNumber); break;
        case "orderDate": cmp = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(); break;
        case "total": cmp = a.total - b.total; break;
        case "supplier": cmp = a.supplier.name.localeCompare(b.supplier.name); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [orders, search, statusFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/buying/purchase-orders/new">
          <Button><Plus className="h-4 w-4 mr-1" /> New PO</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by PO # or supplier..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
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
                <TableHead className="cursor-pointer" onClick={() => toggleSort("poNumber")}>
                  <div className="flex items-center gap-1">PO # <ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("supplier")}>
                  <div className="flex items-center gap-1">Supplier <ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("orderDate")}>
                  <div className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("total")}>
                  <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></div>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {search || statusFilter !== "all" ? "No orders match your filters." : "No purchase orders yet."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((po) => (
                  <TableRow key={po.id} className="cursor-pointer" onClick={() => router.push(`/buying/purchase-orders/${po.id}`)}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.supplier.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(po.orderDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {po.currency.symbol}{po.total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(po.status)}>
                        {po.status.replace("_", " ")}
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
