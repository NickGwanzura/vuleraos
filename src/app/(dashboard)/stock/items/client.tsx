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
import {
  Package,
  Plus,
  Search,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: { id: string; name: string } | null;
  unitOfMeasure: string;
  defaultPrice: number | null;
  costPrice: number | null;
  currentStock: number;
  minimumStock: number | null;
  valuationMethod: string;
  currency: { code: string; symbol: string } | null;
  barcode: string | null;
  createdAt: string;
}

interface ItemsListProps {
  items: Item[];
  categories: Category[];
}

type SortField = "name" | "sku" | "currentStock" | "defaultPrice";
type SortDir = "asc" | "desc";

export function ItemsList({ items, categories }: ItemsListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          (item.barcode && item.barcode.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category?.id === categoryFilter);
    }

    // Stock filter
    if (stockFilter === "low") {
      result = result.filter(
        (item) =>
          item.minimumStock !== null && item.currentStock <= item.minimumStock
      );
    } else if (stockFilter === "out") {
      result = result.filter((item) => item.currentStock === 0);
    } else if (stockFilter === "active") {
      // All are active already
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "sku":
          cmp = a.sku.localeCompare(b.sku);
          break;
        case "currentStock":
          cmp = a.currentStock - b.currentStock;
          break;
        case "defaultPrice":
          cmp = (a.defaultPrice ?? 0) - (b.defaultPrice ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, search, categoryFilter, stockFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === filteredItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredItems.map((i) => i.id)));
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/stock/items/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Item
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, or barcode..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={(value) => setStockFilter(value ?? "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Stock level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="out">Out of stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={
                      filteredItems.length > 0 &&
                      selected.size === filteredItems.length
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort("sku")}
                >
                  <div className="flex items-center gap-1">
                    SKU
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right"
                  onClick={() => toggleSort("currentStock")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Stock
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground text-right hidden md:table-cell"
                  onClick={() => toggleSort("defaultPrice")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Price
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {search || categoryFilter !== "all" || stockFilter !== "all"
                        ? "No items match your filters."
                        : "No items yet. Create your first item."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/stock/items/${item.id}`)}
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="w-10"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.minimumStock !== null &&
                          item.currentStock <= item.minimumStock && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.category?.name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={
                            item.minimumStock !== null &&
                            item.currentStock <= item.minimumStock
                              ? "text-amber-600 font-medium"
                              : ""
                          }
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.unitOfMeasure}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      {item.defaultPrice !== null
                        ? formatCurrency(item.defaultPrice, item.currency)
                        : "—"}
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
