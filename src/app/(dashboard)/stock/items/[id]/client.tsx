"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Plus,
  ArrowDown,
  ArrowUp,
  Package,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface Item {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: { id: string; name: string } | null;
  currency: { id: string; code: string; symbol: string } | null;
  unitOfMeasure: string;
  defaultPrice: number | null;
  costPrice: number | null;
  currentStock: number;
  minimumStock: number | null;
  valuationMethod: string;
  barcode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  unitCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdBy: { name: string };
  currency: { code: string; symbol: string } | null;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
}

interface ItemDetailProps {
  item: Item;
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
}

type TabId = "details" | "transactions";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ItemDetail({
  item,
  transactions,
  categories,
  currencies,
}: ItemDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockForm, setStockForm] = useState({
    type: "IN",
    quantity: "",
    notes: "",
  });

  // Edit form state
  const [form, setForm] = useState({
    name: item.name,
    sku: item.sku,
    description: item.description || "",
    categoryId: item.category?.id || "",
    unitOfMeasure: item.unitOfMeasure,
    barcode: item.barcode || "",
    defaultPrice: item.defaultPrice?.toString() || "",
    costPrice: item.costPrice?.toString() || "",
    currencyId: item.currency?.id || "",
    minimumStock: item.minimumStock?.toString() || "",
    valuationMethod: item.valuationMethod,
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.name || !form.sku) {
      toast.error("Name and SKU are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/stock/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          description: form.description || null,
          categoryId: form.categoryId || null,
          unitOfMeasure: form.unitOfMeasure,
          barcode: form.barcode || null,
          defaultPrice: form.defaultPrice || null,
          costPrice: form.costPrice || null,
          currencyId: form.currencyId || null,
          minimumStock: form.minimumStock || null,
          valuationMethod: form.valuationMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success("Item updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleStockAdjustment() {
    if (!stockForm.quantity || Number(stockForm.quantity) <= 0) {
      toast.error("Quantity must be positive");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/stock/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          type: stockForm.type,
          quantity: stockForm.quantity,
          notes: stockForm.notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to adjust stock");
        return;
      }

      toast.success(
        stockForm.type === "IN"
          ? "Stock received"
          : stockForm.type === "OUT"
            ? "Stock removed"
            : "Stock adjusted"
      );
      setStockDialogOpen(false);
      setStockForm({ type: "IN", quantity: "", notes: "" });
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "transactions", label: "Stock Movements" },
  ];

  const isLowStock =
    item.minimumStock !== null && item.currentStock <= item.minimumStock;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/stock/items"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {item.name}
              </h1>
              <span className="font-mono text-xs text-muted-foreground">
                {item.sku}
              </span>
              {isLowStock && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                >
                  Low Stock
                </Badge>
              )}
              {!item.isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {item.category?.name || "Uncategorized"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
            <DialogTrigger className="outline-none cursor-pointer">
              <Button variant="outline" type="button">
                <Package className="h-4 w-4 mr-1" />
                Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
                <DialogDescription>
                  Record a stock movement for {item.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={stockForm.type}
                    onValueChange={(value) =>
                      setStockForm({ ...stockForm, type: value ?? "IN" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Stock In (Receive)</SelectItem>
                      <SelectItem value="OUT">Stock Out (Issue)</SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={stockForm.quantity}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Reason for adjustment"
                    value={stockForm.notes}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setStockDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleStockAdjustment} disabled={saving}>
                  {saving ? "Processing..." : "Record"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <Card>
          <CardContent className="pt-6">
            {/* Stock Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold">{item.currentStock}</p>
                <p className="text-xs text-muted-foreground">
                  Current Stock ({item.unitOfMeasure})
                </p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold">
                  {item.minimumStock !== null ? item.minimumStock : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Min. Level</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold">
                  {item.defaultPrice !== null
                    ? formatCurrency(item.defaultPrice, item.currency)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Selling Price</p>
              </div>
            </div>

            {editing ? (
              <div className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => update("sku", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(value) =>
                      update("categoryId", value ?? "")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit of Measure</Label>
                  <Select
                    value={form.unitOfMeasure}
                    onValueChange={(value) =>
                      update("unitOfMeasure", value ?? "each")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="each">Each</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="g">Gram</SelectItem>
                      <SelectItem value="l">Litre</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="bag">Bag</SelectItem>
                      <SelectItem value="bottle">Bottle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.defaultPrice}
                      onChange={(e) =>
                        update("defaultPrice", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.costPrice}
                      onChange={(e) => update("costPrice", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Min. Stock Level</Label>
                  <Input
                    type="number"
                    value={form.minimumStock}
                    onChange={(e) =>
                      update("minimumStock", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valuation Method</Label>
                  <Select
                    value={form.valuationMethod}
                    onValueChange={(value) =>
                      update("valuationMethod", value ?? "FIFO")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIFO">FIFO</SelectItem>
                      <SelectItem value="WEIGHTED_AVERAGE">
                        Weighted Average
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input
                    value={form.barcode}
                    onChange={(e) => update("barcode", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 max-w-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="text-sm">
                    {item.category?.name || "Uncategorized"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Unit of Measure
                  </p>
                  <p className="text-sm capitalize">{item.unitOfMeasure}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Valuation Method
                  </p>
                  <p className="text-sm">
                    {item.valuationMethod === "FIFO"
                      ? "FIFO (First In, First Out)"
                      : "Weighted Average"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Cost Price
                  </p>
                  <p className="text-sm">
                    {item.costPrice !== null
                      ? formatCurrency(item.costPrice, item.currency)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Barcode</p>
                  <p className="text-sm font-mono">
                    {item.barcode || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Created
                  </p>
                  <p className="text-sm">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                {item.description && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    Unit Cost
                  </TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No stock movements recorded yet.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {tx.type === "IN" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-green-600" />
                          ) : tx.type === "OUT" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-red-600" />
                          ) : (
                            <Package className="h-3.5 w-3.5 text-amber-600" />
                          )}
                          <Badge
                            variant="outline"
                            className={
                              tx.type === "IN"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : tx.type === "OUT"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                            }
                          >
                            {tx.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {tx.type === "OUT" ? "-" : "+"}
                        {tx.quantity}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        {tx.unitCost !== null
                          ? formatCurrency(tx.unitCost, tx.currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tx.referenceType
                          ? `${tx.referenceType.replace("_", " ")}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {tx.createdBy.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                        {tx.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
