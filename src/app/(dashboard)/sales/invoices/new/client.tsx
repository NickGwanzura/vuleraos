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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

interface Customer {
  id: string;
  name: string;
  bpNumber: string | null;
  email: string | null;
  phone: string | null;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

interface InvoiceCreateFormProps {
  customers: Customer[];
  currencies: Currency[];
}

interface LineItem {
  key: string;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

type TabId = "details" | "items" | "accounting";

function generateKey() {
  return Math.random().toString(36).substring(2, 9);
}

export function InvoiceCreateForm({ customers, currencies }: InvoiceCreateFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [saving, setSaving] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "" });

  const [form, setForm] = useState({
    customerId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currencyId: currencies[0]?.id || "",
    vatRate: "15",
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: generateKey(), itemId: null, description: "", quantity: 1, unitPrice: 0, vatRate: 15 },
  ]);

  const [itemSearchResults, setItemSearchResults] = useState<any[]>([]);
  const [itemSearchOpen, setItemSearchOpen] = useState<string | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      { key: generateKey(), itemId: null, description: "", quantity: 1, unitPrice: 0, vatRate: Number(form.vatRate) },
    ]);
  }, [form.vatRate]);

  function removeLineItem(key: string) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  }

  function updateLineItem(key: string, field: string, value: any) {
    setLineItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    );
  }

  async function searchItems(query: string) {
    setItemSearchQuery(query);
    if (query.length < 1) {
      setItemSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/stock/items?search=${encodeURIComponent(query)}&isActive=true`);
      if (res.ok) {
        const data = await res.json();
        setItemSearchResults(data.slice(0, 10));
      }
    } catch {}
  }

  function selectItem(lineKey: string, item: any) {
    updateLineItem(lineKey, "itemId", item.id);
    updateLineItem(lineKey, "description", item.name);
    updateLineItem(lineKey, "unitPrice", item.defaultPrice || 0);
    setItemSearchOpen(null);
    setItemSearchQuery("");
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalVat = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate / 100),
    0
  );
  const grandTotal = subtotal + totalVat;
  const selectedCurrency = currencies.find((c) => c.id === form.currencyId) ?? null;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  async function handleCreateCustomer() {
    if (!customerForm.name) {
      toast.error("Customer name is required");
      return;
    }
    try {
      const res = await fetch("/api/sales/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerForm),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create customer");
        return;
      }
      const customer = await res.json();
      updateForm("customerId", customer.id);
      setCustomerDialogOpen(false);
      setCustomerForm({ name: "", email: "", phone: "" });
      toast.success("Customer created");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.customerId) {
      toast.error("Please select a customer");
      return;
    }

    const validItems = lineItems.filter((item) => item.description && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error("At least one line item with a description is required");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/sales/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
          currencyId: form.currencyId,
          vatRate: Number(form.vatRate),
          notes: form.notes || null,
          items: validItems.map((item) => ({
            itemId: item.itemId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create invoice");
        return;
      }

      const invoice = await res.json();
      toast.success("Invoice created");
      router.push(`/sales/invoices/${invoice.id}`);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "items", label: "Items" },
    { id: "accounting", label: "Accounting" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sales/invoices" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
            <p className="text-sm text-muted-foreground">Create a new sales invoice</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Creating..." : "Create Invoice"}
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

      <Card>
        <CardContent className="pt-6">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>
                  Customer <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={form.customerId}
                    onValueChange={(value) => updateForm("customerId", value ?? "")}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                    <DialogTrigger className="outline-none cursor-pointer">
                      <Button variant="outline" type="button" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>New Customer</DialogTitle>
                        <DialogDescription>Add a new customer to your business</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 py-2">
                        <div className="space-y-1">
                          <Label>Name *</Label>
                          <Input
                            value={customerForm.name}
                            onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                            placeholder="Customer name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Email</Label>
                          <Input
                            value={customerForm.email}
                            onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Phone</Label>
                          <Input
                            value={customerForm.phone}
                            onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                            placeholder="+263 7X XXX XXXX"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateCustomer}>Create</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => updateForm("issueDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => updateForm("dueDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currencyId} onValueChange={(value) => updateForm("currencyId", value ?? "")}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} ({c.symbol}) — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Terms, shipping info, or internal notes..."
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Items Tab */}
          {activeTab === "items" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium w-[40%]">Description</th>
                      <th className="pb-2 font-medium w-[15%] text-right">Qty</th>
                      <th className="pb-2 font-medium w-[18%] text-right">Unit Price</th>
                      <th className="pb-2 font-medium w-[12%] text-right">VAT %</th>
                      <th className="pb-2 font-medium w-[15%] text-right">Total</th>
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
                              <Input
                                placeholder="Item name or description"
                                value={item.description}
                                onChange={(e) => updateLineItem(item.key, "description", e.target.value)}
                                onFocus={() => setItemSearchOpen(item.key)}
                                className="h-8 text-sm"
                              />
                              {itemSearchOpen === item.key && (
                                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
                                  <div className="p-2 border-b">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                      <Input
                                        placeholder="Search items..."
                                        className="pl-7 h-7 text-xs"
                                        value={itemSearchQuery}
                                        onChange={(e) => searchItems(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  {itemSearchResults.map((result: any) => (
                                    <button
                                      key={result.id}
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex justify-between"
                                      onClick={() => selectItem(item.key, result)}
                                    >
                                      <span>{result.name}</span>
                                      <span className="text-muted-foreground text-xs">
                                        {result.sku} — {result.defaultPrice != null && formatCurrency(result.defaultPrice, result.currency)}
                                      </span>
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
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.key, "quantity", Number(e.target.value) || 0)}
                              className="h-8 text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(item.key, "unitPrice", Number(e.target.value) || 0)}
                              className="h-8 text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.vatRate}
                              onChange={(e) => updateLineItem(item.key, "vatRate", Number(e.target.value) || 0)}
                              className="h-8 text-sm text-right"
                            />
                          </td>
                          <td className="py-2 pl-2 text-right font-medium">
                            {formatCurrency(lineTotal, selectedCurrency)}
                          </td>
                          <td className="py-2 pl-1">
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.key)}
                              className="text-muted-foreground hover:text-destructive p-1"
                              disabled={lineItems.length <= 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" size="sm" onClick={addLineItem} type="button">
                <Plus className="h-4 w-4 mr-1" />
                Add Line Item
              </Button>

              {/* Totals */}
              <div className="border-t pt-4 flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal, selectedCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT</span>
                    <span>{formatCurrency(totalVat, selectedCurrency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotal, selectedCurrency)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Accounting Tab */}
          {activeTab === "accounting" && (
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>Default VAT Rate (%)</Label>
                <Select
                  value={form.vatRate}
                  onValueChange={(value) => {
                    updateForm("vatRate", value ?? "15");
                    setLineItems((prev) =>
                      prev.map((item) => ({ ...item, vatRate: Number(value) || 15 }))
                    );
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Zero-rated (0%)</SelectItem>
                    <SelectItem value="15">Standard (15%)</SelectItem>
                    <SelectItem value="EXEMPT">Exempt</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default VAT rate for new line items. You can override per item.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1 text-sm">
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{lineItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT ({form.vatRate}%)</span>
                  <span>{formatCurrency(totalVat, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal, selectedCurrency)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
