"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ZIMBABWEAN_BANKS } from "@/lib/currency";

interface Currency { id: string; code: string; symbol: string; name: string }
interface EmployeeCreateFormProps { currencies: Currency[] }

type TabId = "personal" | "employment" | "payroll";

export function EmployeeCreateForm({ currencies }: EmployeeCreateFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", employeeCode: "", email: "", phone: "",
    department: "", position: "",
    basicSalary: "", currencyId: "", bankName: "", bankAccount: "",
    taxIdNumber: "", nssaNumber: "", startDate: new Date().toISOString().split("T")[0],
  });

  function update(field: string, value: string) { setForm(p => ({ ...p, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.employeeCode) { toast.error("Name and employee code are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, basicSalary: form.basicSalary || null, currencyId: form.currencyId || null }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      const emp = await res.json();
      toast.success("Employee created");
      router.push(`/hr/employees/${emp.id}`);
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "personal", label: "Personal" }, { id: "employment", label: "Employment" }, { id: "payroll", label: "Payroll" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hr/employees" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div><h1 className="text-2xl font-semibold tracking-tight">New Employee</h1><p className="text-sm text-muted-foreground">Add a new staff member</p></div>
        </div>
        <Button onClick={handleSubmit} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Creating..." : "Save"}</Button>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t.label}</button>)}
      </div>

      <Card><CardContent className="pt-6">
        {activeTab === "personal" && <div className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name *</Label><Input value={form.firstName} onChange={e => update("firstName", e.target.value)} /></div>
            <div className="space-y-2"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => update("lastName", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Employee Code *</Label><Input placeholder="e.g. EMP-001" value={form.employeeCode} onChange={e => update("employeeCode", e.target.value)} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="employee@company.co.zw" value={form.email} onChange={e => update("email", e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input placeholder="+263 7X XXX XXXX" value={form.phone} onChange={e => update("phone", e.target.value)} /></div>
        </div>}

        {activeTab === "employment" && <div className="space-y-4 max-w-lg">
          <div className="space-y-2"><Label>Department</Label><Input placeholder="e.g. Sales, IT, Finance" value={form.department} onChange={e => update("department", e.target.value)} /></div>
          <div className="space-y-2"><Label>Position</Label><Input placeholder="e.g. Senior Accountant" value={form.position} onChange={e => update("position", e.target.value)} /></div>
          <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => update("startDate", e.target.value)} /></div>
        </div>}

        {activeTab === "payroll" && <div className="space-y-4 max-w-lg">
          <div className="space-y-2"><Label>Basic Salary</Label><Input type="number" step="0.01" min="0" placeholder="0.00" value={form.basicSalary} onChange={e => update("basicSalary", e.target.value)} /></div>
          <div className="space-y-2"><Label>Currency</Label><Select value={form.currencyId} onValueChange={v => update("currencyId", v ?? "")}><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c.id} value={c.id}>{c.code} ({c.symbol})</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Bank</Label><Select value={form.bankName} onValueChange={v => update("bankName", v ?? "")}><SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger><SelectContent>{ZIMBABWEAN_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Bank Account</Label><Input value={form.bankAccount} onChange={e => update("bankAccount", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>PAYE Number</Label><Input placeholder="Tax ID" value={form.taxIdNumber} onChange={e => update("taxIdNumber", e.target.value)} /></div>
            <div className="space-y-2"><Label>NSSA Number</Label><Input value={form.nssaNumber} onChange={e => update("nssaNumber", e.target.value)} /></div>
          </div>
        </div>}
      </CardContent></Card>
    </div>
  );
}
