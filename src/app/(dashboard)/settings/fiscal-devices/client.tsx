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
import { ArrowLeft, Save, Printer, Building2, DollarSign, Plus, CheckCircle, XCircle, Landmark } from "lucide-react";

interface FiscalDevice {
  id: string;
  deviceId: string;
  serialNumber: string;
  model: string;
  status: string;
  lastCommunication: string | null;
  certificate: string | null;
  createdAt: string;
  _count: { salesInvoices: number };
}

interface FiscalDevicesSettingsProps {
  devices: FiscalDevice[];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FiscalDevicesSettings({ devices }: FiscalDevicesSettingsProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ deviceId: "", serialNumber: "", model: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.deviceId || !form.serialNumber || !form.model) {
      toast.error("All fields are required"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/fiscal-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Fiscal device registered");
      setShowForm(false);
      setForm({ deviceId: "", serialNumber: "", model: "" });
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  const tabs = [
    { label: "General", href: "/settings", icon: Building2 },
    { label: "Currency", href: "/settings/currency", icon: DollarSign },
    { label: "Fiscal Devices", href: "/settings/fiscal-devices", icon: Printer, active: true },
    { label: "Chart of Accounts", href: "/settings/chart-of-accounts", icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fiscal Devices</h1>
          <p className="text-sm text-muted-foreground mt-1">Register ZIMRA fiscal devices for compliant invoicing</p>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                (t as any).active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Registered Devices ({devices.length})</CardTitle>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Register Device
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleAdd} className="space-y-4 max-w-md mb-6 p-4 border rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium">Register New Fiscal Device</h4>
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID</Label>
                <Input id="deviceId" placeholder="e.g. FD-001" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input id="serialNumber" placeholder="e.g. SN-2024-12345" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" placeholder="e.g. ZRA-FD-2000" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Registering..." : "Register"}</Button>
              </div>
            </form>
          )}

          {devices.length === 0 && !showForm ? (
            <div className="text-center py-8">
              <Printer className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No fiscal devices registered.</p>
              <p className="text-xs text-muted-foreground mt-1">Register a fiscal device to issue ZIMRA-compliant fiscal invoices.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{d.deviceId}</p>
                      <Badge variant="outline" className={`text-xs ${
                        d.status === "ACTIVE" ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
                      }`}>
                        {d.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.model} • SN: {d.serialNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d._count.salesInvoices} invoice(s) fiscalised • Last comm: {formatDate(d.lastCommunication)}
                    </p>
                  </div>
                  {d.status === "ACTIVE" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
