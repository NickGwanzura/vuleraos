"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

interface ItemCreateFormProps {
  categories: Category[];
  currencies: Currency[];
}

type TabId = "details" | "pricing" | "stock";

export function ItemCreateForm({ categories, currencies }: ItemCreateFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    categoryId: "",
    unitOfMeasure: "each",
    barcode: "",
    defaultPrice: "",
    costPrice: "",
    currencyId: "",
    currentStock: "0",
    minimumStock: "",
    valuationMethod: "FIFO",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.sku) {
      toast.error("Name and SKU are required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/stock/items", {
        method: "POST",
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
          currentStock: form.currentStock || "0",
          minimumStock: form.minimumStock || null,
          valuationMethod: form.valuationMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create item");
        return;
      }

      const item = await res.json();
      toast.success("Item created successfully");
      router.push(`/stock/items/${item.id}`);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "pricing", label: "Pricing" },
    { id: "stock", label: "Stock" },
  ];

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
            <h1 className="text-2xl font-semibold tracking-tight">New Item</h1>
            <p className="text-sm text-muted-foreground">
              Add a new product or stock item
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Saving..." : "Save"}
        </Button>
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

      {/* Tab Content */}
      <Card>
        <CardContent className="pt-6">
          {activeTab === "details" && (
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Item Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Bluetooth Speaker"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  placeholder="e.g. ELEC-001"
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => update("categoryId", value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                <Select
                  value={form.unitOfMeasure}
                  onValueChange={(value) => update("unitOfMeasure", value ?? "each")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="each">Each</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="g">Gram</SelectItem>
                    <SelectItem value="l">Litre</SelectItem>
                    <SelectItem value="ml">Millilitre</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="bag">Bag</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="m">Metre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Optional barcode number"
                  value={form.barcode}
                  onChange={(e) => update("barcode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional item description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={form.currencyId}
                  onValueChange={(value) => update("currencyId", value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((cur) => (
                      <SelectItem key={cur.id} value={cur.id}>
                        {cur.code} ({cur.symbol}) — {cur.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultPrice">Selling Price</Label>
                  <Input
                    id="defaultPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.defaultPrice}
                    onChange={(e) => update("defaultPrice", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.costPrice}
                    onChange={(e) => update("costPrice", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valuationMethod">Valuation Method</Label>
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
                    <SelectItem value="FIFO">
                      FIFO (First In, First Out)
                    </SelectItem>
                    <SelectItem value="WEIGHTED_AVERAGE">
                      Weighted Average
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {activeTab === "stock" && (
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Opening Stock Quantity</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.currentStock}
                  onChange={(e) => update("currentStock", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Initial stock level when creating this item
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumStock">Minimum Stock Level</Label>
                <Input
                  id="minimumStock"
                  type="number"
                  min="0"
                  placeholder="Not set"
                  value={form.minimumStock}
                  onChange={(e) => update("minimumStock", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when stock drops below this level
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
