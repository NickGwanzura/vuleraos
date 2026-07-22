"use client";

import { useState, useCallback } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

interface POCreateFormProps {
  suppliers: Supplier[];
  currencies: Currency[];
}

interface LineItem {
  key: string;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

type TabId = "details" | "items";

function genKey() { return Math.random().toString(36).substring(2, 9); }

export function POCreateForm({ suppliers, currencies }: POCreateFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [saving, setSaving] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", email: "", phone: "" });

  const [form, setForm] = useState({
    supplierId: "",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDate: "",
    currencyId: currencies[0]?.id || "",
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: genKey(), itemId: null, description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [itemSearchResults, setItemSearchResults] = useState<any[]>([]);
  const [itemSearchOpen, setItemSearchOpen] = useState<string | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const selectedCurrency = currencies.find((c) => c.id === form.currencyId) ?? null;

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  const addItem = useCallback(() => {
    setLineItems((p) => [...p, { key: genKey(), itemId: null, description: "", quantity: 1, unitPrice: 0 }]);
  }, []);

  function removeItem(key: string) {
    if (lineItems.length <= 1) return;
    setLineItems((p) => p.filter((i) => i.key !== key));
  }

  function updateItem(key: string, field: string, value: any) {
    setLineItems((p) => p.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  }

  async function searchItems(query: string) {
    setItemSearchQuery(query);
    if (query.length < 1) { setItemSearchResults([]); return; }
    try {
      const res = await fetch(`/api/stock/items?search=${encodeURIComponent(query)}&isActive=true`);
      if (res.ok) setItemSearchResults((await res.json()).slice(0, 10));
    } catch {}
  }

  function selectItem(lineKey: string, item: any) {
    updateItem(lineKey, "itemId", item.id);
    updateItem(lineKey, "description", item.name);
    updateItem(lineKey, "unitPrice", item.costPrice || item.defaultPrice || 0);
    setItemSearchOpen(null);
    setItemSearchQuery("");
  }

  async function handleCreateSupplier() {
    if (!supplierForm.name) { toast.error("Supplier name is required"); return; }
    try {
      const res = await fetch("/api/buying/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      const s = await res.json();
      update("supplierId", s.id);
      setSupplierDialogOpen(false);
      setSupplierForm({ name: "", email: "", phone: "" });
      toast.success("Supplier created");
      router.refresh();
    } catch { toast.error("An error occurred"); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId) { toast.error("Please select a supplier"); return; }
    const validItems = lineItems.filter((i) => i.description && i.quantity > 0);
    if (validItems.length === 0) { toast.error("At least one line item is required"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/buying/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: form.supplierId,
          orderDate: form.orderDate,
          expectedDate: form.expectedDate || null,
          currencyId: form.currencyId,
          notes: form.notes || null,
          items: validItems.map((i) => ({
            itemId: i.itemId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      const po = await res.json();
      toast.success("Purchase order created");
      router.push(`/buying/purchase-orders/${po.id}`);
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "items", label: "Items" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/buying/purchase-orders" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Purchase Order</h1>
            <p className="text-sm text-muted-foreground">Create a purchase order for your supplier</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{saving ? "Creating..." : "Create PO"}
        </Button>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>{t.label}</button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          {activeTab === "details" && (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <div className="flex gap-2">
                  <Select value={form.supplierId} onValueChange={(v) => update("supplierId", v ?? "")}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                    <DialogTrigger className="outline-none cursor-pointer">
                      <Button variant="outline" type="button" size="icon"><Plus className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>New Supplier</DialogTitle><DialogDescription>Add a supplier</DialogDescription></DialogHeader>
                      <div className="space-y-3 py-2">
                        <div className="space-y-1"><Label>Name *</Label><Input value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Email</Label><Input value={supplierForm.email} onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})} /></div>
                        <div className="space-y-1"><Label>Phone</Label><Input value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} /></div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSupplierDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSupplier}>Create</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderDate">Order Date</Label>
                  <Input id="orderDate" type="date" value={form.orderDate} onChange={(e) => update("orderDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedDate">Expected Date</Label>
                  <Input id="expectedDate" type="date" value={form.expectedDate} onChange={(e) => update("expectedDate", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currencyId} onValueChange={(v) => update("currencyId", v ?? "")}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} ({c.symbol})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Delivery instructions, terms..." value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {activeTab === "items" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium w-[45%]">Description</th>
                      <th className="pb-2 font-medium w-[15%] text-right">Qty</th>
                      <th className="pb-2 font-medium w-[20%] text-right">Unit Price</th>
                      <th className="pb-2 font-medium w-[20%] text-right">Total</th>
                      <th className="pb-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => {
                      const lineTotal = item.quantity * item.unitPrice;
                      return (
                        <tr key={item.key} className="border-b hover:bg-muted/30">
                          <td className="py-2 pr-2">
                            <div className="relative">
                              <Input placeholder="Item description" value={item.description} onChange={(e) => updateItem(item.key, "description", e.target.value)}
                                onFocus={() => setItemSearchOpen(item.key)} className="h-8 text-sm" />
                              {itemSearchOpen === item.key && (
                                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
                                  <div className="p-2 border-b">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                      <Input placeholder="Search items..." className="pl-7 h-7 text-xs" value={itemSearchQuery} onChange={(e) => searchItems(e.target.value)} />
                                    </div>
                                  </div>
                                  {itemSearchResults.map((r: any) => (
                                    <button key={r.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between"
                                      onClick={() => selectItem(item.key, r)}>
                                      <span>{r.name}</span>
                                      <span className="text-muted-foreground text-xs">{r.sku}</span>
                                    </button>
                                  ))}
                                  {itemSearchQuery && itemSearchResults.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-muted-foreground">No items found</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-1">
                            <Input type="number" min="0" step="1" value={item.quantity}
                              onChange={(e) => updateItem(item.key, "quantity", Number(e.target.value) || 0)} className="h-8 text-sm text-right" />
                          </td>
                          <td className="py-2 px-1">
                            <Input type="number" min="0" step="0.01" value={item.unitPrice}
                              onChange={(e) => updateItem(item.key, "unitPrice", Number(e.target.value) || 0)} className="h-8 text-sm text-right" />
                          </td>
                          <td className="py-2 pl-2 text-right font-medium">{formatCurrency(lineTotal, selectedCurrency)}</td>
                          <td className="py-2 pl-1">
                            <button type="button" onClick={() => removeItem(item.key)} className="text-muted-foreground hover:text-destructive p-1" disabled={lineItems.length <= 1}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" size="sm" onClick={addItem} type="button"><Plus className="h-4 w-4 mr-1" /> Add Line Item</Button>
              <div className="border-t pt-4 flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal, selectedCurrency)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{formatCurrency(subtotal, selectedCurrency)}</span></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
