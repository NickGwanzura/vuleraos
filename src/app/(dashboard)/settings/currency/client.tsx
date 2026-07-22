"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, DollarSign, Building2, Printer, ArrowUpDown, Landmark } from "lucide-react";

interface Rate {
  id: string;
  rate: number;
  parallelMarketRate: number | null;
  effectiveDate: string;
  isManualOverride: boolean;
  notes: string | null;
  fromCurrency: { code: string };
  toCurrency: { code: string };
  createdBy: { name: string };
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

interface CurrencySettingsProps {
  rates: Rate[];
  currencies: Currency[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CurrencySettings({ rates, currencies }: CurrencySettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    rate: "",
    parallelMarketRate: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    isManualOverride: false,
    notes: "",
  });

  // Filter rates for USD→ZWG (the primary pair)
  const usdToZwRates = rates.filter(
    (r) => r.fromCurrency.code === "USD" && r.toCurrency.code === "ZWG"
  );

  const latestRate = usdToZwRates[0] || null;

  async function handleAddRate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rate || Number(form.rate) <= 0) {
      toast.error("Valid rate is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/currency/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCurrency: "USD",
          toCurrency: "ZWG",
          rate: form.rate,
          parallelMarketRate: form.parallelMarketRate || null,
          effectiveDate: form.effectiveDate,
          isManualOverride: form.isManualOverride,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Exchange rate added");
      setShowForm(false);
      setForm({ rate: "", parallelMarketRate: "", effectiveDate: new Date().toISOString().split("T")[0], isManualOverride: false, notes: "" });
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  const tabs = [
    { label: "General", href: "/settings", icon: Building2 },
    { label: "Currency", href: "/settings/currency", icon: DollarSign, active: true },
    { label: "Fiscal Devices", href: "/settings/fiscal-devices", icon: Printer },
    { label: "Chart of Accounts", href: "/settings/chart-of-accounts", icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Currency Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage exchange rates for USD ↔ ZWG</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                (t as any).active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </div>

      {/* Current Rate */}
      {latestRate && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Official Rate</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">ZiG {latestRate.rate.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">1 USD = {latestRate.rate.toFixed(4)} ZWG</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Parallel Market</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">
                {latestRate.parallelMarketRate ? `ZiG ${latestRate.parallelMarketRate.toFixed(4)}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">As of {formatDate(latestRate.effectiveDate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent>
              {latestRate.isManualOverride ? (
                <Badge variant="outline" className="bg-amber-100 text-amber-800">Manual Override</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100 text-green-800">Auto Rate</Badge>
              )}
              <p className="text-xs text-muted-foreground mt-1">Set by {latestRate.createdBy.name}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Rate Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {showForm ? "New Exchange Rate" : "Rate History"}
          </CardTitle>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              + Add Rate
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showForm ? (
            <form onSubmit={handleAddRate} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Date</Label>
                <Input id="effectiveDate" type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Official Rate (USD → ZWG)</Label>
                  <Input id="rate" type="number" step="0.0001" min="0" placeholder="e.g. 26.5000" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parallelMarketRate">Parallel Market Rate</Label>
                  <Input id="parallelMarketRate" type="number" step="0.0001" min="0" placeholder="e.g. 32.0000" value={form.parallelMarketRate} onChange={(e) => setForm({ ...form, parallelMarketRate: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isManualOverride"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={form.isManualOverride}
                  onChange={(e) => setForm({ ...form, isManualOverride: e.target.checked })}
                />
                <Label htmlFor="isManualOverride" className="text-sm">
                  Manual override (interbank rate may differ from market reality)
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" placeholder="e.g. End-of-day rate from RBZ" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Add Rate"}</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {usdToZwRates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No exchange rates recorded yet.</p>
              ) : (
                usdToZwRates.slice(0, 30).map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-24">{formatDate(rate.effectiveDate).split(",")[0]}</span>
                      <span className="text-sm font-medium">1 USD = {rate.rate.toFixed(4)} ZWG</span>
                      {rate.parallelMarketRate && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                          Parallel: {rate.parallelMarketRate.toFixed(4)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {rate.isManualOverride && <span className="text-xs text-amber-600">Override</span>}
                      <span className="text-xs text-muted-foreground">{rate.createdBy.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
