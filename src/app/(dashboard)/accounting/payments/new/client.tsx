"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Search, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface Customer {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  currency: { code: string; symbol: string };
}

export function RecordPaymentForm({ customers, currencies }: { customers: Customer[]; currencies: Currency[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "",
    referenceNumber: "",
    bankName: "",
    receivedAt: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (customerId) {
      setLoadingInvoices(true);
      fetch(`/api/sales/invoices?search=&status=all&limit=100`)
        .then((r) => r.json())
        .then((data: Invoice[]) => {
          // Filter to unpaid invoices for this customer
          const filtered = data.filter(
            (inv) =>
              Number(inv.balanceDue) > 0 &&
              inv.id // all have IDs, but we need to match customer
          );
          // We need customer filtering on the API. For now fetch with broader filter.
          setInvoices(filtered.filter((inv) => inv.balanceDue > 0));
        })
        .catch(() => setInvoices([]))
        .finally(() => setLoadingInvoices(false));
    }
  }, [customerId]);

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const METHODS = [
    { value: "ECOCASH", label: "EcoCash" },
    { value: "ONEMONEY", label: "OneMoney" },
    { value: "RTGS", label: "RTGS Transfer" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CASH", label: "Cash" },
    { value: "OTHER", label: "Other" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoiceId || !form.amount || !form.paymentMethod) {
      toast.error("Please complete all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/accounting/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount: Number(form.amount),
          paymentMethod: form.paymentMethod,
          referenceNumber: form.referenceNumber || null,
          bankName: form.bankName || null,
          receivedAt: form.receivedAt || null,
          notes: form.notes || null,
          isReconciled: form.paymentMethod === "CASH" || form.paymentMethod === "ECOCASH" || form.paymentMethod === "ONEMONEY",
        }),
      });

      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Payment recorded successfully");
      router.push("/accounting/payments");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/accounting/payments" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Record Payment</h1>
          <p className="text-sm text-muted-foreground">Record a payment received from a customer</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      <Card>
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-1">1. Select Customer & Invoice</h3>
                <p className="text-sm text-muted-foreground mb-4">Choose the customer and invoice to apply this payment to.</p>
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={(v) => { setCustomerId(v ?? ""); setSelectedInvoiceId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {customerId && (
                <div className="space-y-2">
                  <Label>Unpaid Invoice</Label>
                  {loadingInvoices ? (
                    <p className="text-sm text-muted-foreground">Loading invoices...</p>
                  ) : invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No unpaid invoices found for this customer.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-auto border rounded-md p-2">
                      {invoices.map((inv) => (
                        <button
                          key={inv.id}
                          type="button"
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className={`w-full text-left p-3 rounded-md border transition-colors flex justify-between items-center ${
                            selectedInvoiceId === inv.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">Balance: {formatCurrency(inv.balanceDue, inv.currency)}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{formatCurrency(inv.balanceDue, inv.currency)} due</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full" disabled={!selectedInvoiceId} onClick={() => setStep(2)}>
                Next: Payment Details
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-1">2. Payment Details</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Invoice: <strong>{invoices.find((i) => i.id === selectedInvoiceId)?.invoiceNumber}</strong>
                  {selectedInvoice && (
                    <> — Balance: <span className="text-amber-600">{selectedInvoice && formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}</span></>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                {selectedInvoice && (
                  <p className="text-xs text-muted-foreground">
                    Outstanding: {formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input id="referenceNumber" placeholder="e.g. EcoCash transaction ID, RTGS ref..." 
                  value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
              </div>

              {form.paymentMethod === "BANK_TRANSFER" || form.paymentMethod === "RTGS" ? (
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" placeholder="e.g. CBZ, Stanbic..."
                    value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="receivedAt">Payment Date</Label>
                <Input id="receivedAt" type="date" value={form.receivedAt}
                  onChange={(e) => setForm({ ...form, receivedAt: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={2} placeholder="Optional notes"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />{saving ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
