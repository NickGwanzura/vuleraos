"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Building2, DollarSign, Printer, Users, FileText } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  businessType: string;
  bpNumber: string | null;
  registrationNumber: string | null;
  defaultCurrency: string;
}

interface SettingsPageProps {
  tenant: Tenant | null;
}

export function SettingsPage({ tenant }: SettingsPageProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: tenant?.name || "",
    bpNumber: tenant?.bpNumber || "",
    registrationNumber: tenant?.registrationNumber || "",
    businessType: tenant?.businessType || "SOLE_TRADER",
    defaultCurrency: tenant?.defaultCurrency || "USD",
  });

  const BUSINESS_TYPES = [
    { value: "SOLE_TRADER", label: "Sole Trader" },
    { value: "PBC", label: "Private Business Corporation (PBC)" },
    { value: "PRIVATE_LIMITED", label: "Private Limited Company" },
    { value: "PUBLIC_LIMITED", label: "Public Limited Company" },
    { value: "PARTNERSHIP", label: "Partnership" },
  ];

  async function handleSave() {
    if (!form.name) { toast.error("Business name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Settings saved");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your business configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b">
        <div className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" /> General
        </div>
        <Link href="/settings/currency" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Currency
        </Link>
        <Link href="/settings/fiscal-devices" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground flex items-center gap-2">
          <Printer className="h-4 w-4" /> Fiscal Devices
        </Link>
        <Link href="/settings/users" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Users
        </Link>
        <Link href="/settings/documents" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" /> Documents
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <select
                id="businessType"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs"
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
              >
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bpNumber">
                BP / VAT Registration Number
                <span className="text-xs text-muted-foreground ml-2">Required for ZIMRA fiscal invoices</span>
              </Label>
              <Input id="bpNumber" placeholder="e.g. BP1234567" value={form.bpNumber} onChange={(e) => setForm({ ...form, bpNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Company Registration Number</Label>
              <Input id="registrationNumber" placeholder="e.g. 1234/2024" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <select
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs"
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
              >
                <option value="USD">USD ($) — US Dollar</option>
                <option value="ZWG">ZWG (ZiG) — Zimbabwe Gold</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
