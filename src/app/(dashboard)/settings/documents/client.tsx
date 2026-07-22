"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save, FileText, Building2, DollarSign, Printer, Landmark } from "lucide-react";
import Link from "next/link";

interface DocumentSettingsProps {
  tenant: { name: string; bpNumber: string | null } | null;
  template: { id: string; content: any } | null;
}

export function DocumentSettings({ tenant, template }: DocumentSettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const content = template?.content || {};
  const [form, setForm] = useState({
    primaryColor: content.primaryColor || "#1e40af",
    headerText: content.headerText || "",
    footerText: content.footerText || "",
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: form, name: "Default Invoice Layout" }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Document settings saved");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  const tabs = [
    { label: "General", href: "/settings", icon: Building2 },
    { label: "Currency", href: "/settings/currency", icon: DollarSign },
    { label: "Fiscal Devices", href: "/settings/fiscal-devices", icon: Printer },
    { label: "Documents", href: "/settings/documents", icon: FileText, active: true },
    { label: "Chart of Accounts", href: "/settings/chart-of-accounts", icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-semibold tracking-tight">Document Settings</h1><p className="text-sm text-muted-foreground">Customise your invoice and document layout</p></div>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => {
          const Icon = t.icon;
          return <Link key={t.href} href={t.href} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${(t as any).active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}><Icon className="h-4 w-4" /> {t.label}</Link>;
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Letterhead Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Brand Colour</Label>
              <div className="flex gap-2 items-center">
                <input type="color" id="primaryColor" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-9 w-9 rounded border cursor-pointer" />
                <Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="flex-1 font-mono" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headerText">Header Text (optional)</Label>
              <Input id="headerText" placeholder="e.g. Tax Invoice" value={form.headerText} onChange={(e) => setForm({ ...form, headerText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text (optional)</Label>
              <textarea id="footerText" rows={3} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Thank you for your business! Payment due within 30 days." value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
            </div>
            <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Preview Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Business Name</p><p className="font-medium">{tenant?.name || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">BP Number</p><p>{tenant?.bpNumber || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Header Colour</p><div className="flex items-center gap-2"><div className="h-4 w-4 rounded border" style={{ backgroundColor: form.primaryColor }} /> <span className="font-mono">{form.primaryColor}</span></div></div>
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">Printing Invoices/POs</p>
              <p className="text-xs">The Print button on invoice and purchase order detail pages will use these settings for the letterhead layout.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
