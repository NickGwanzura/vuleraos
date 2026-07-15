"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Mail, Phone, Building2, DollarSign, Hash } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Employee {
  id: string; employeeCode: string; firstName: string; lastName: string;
  email: string | null; phone: string | null; department: string | null;
  position: string | null; basicSalary: number | null; isActive: boolean;
  bankName: string | null; bankAccount: string | null;
  taxIdNumber: string | null; nssaNumber: string | null;
  startDate: string; endDate: string | null;
  currency: { id: string; code: string; symbol: string } | null;
}

interface EmployeeDetailProps { employee: Employee }

function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" }); }

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: employee.firstName, lastName: employee.lastName,
    email: employee.email || "", phone: employee.phone || "",
    department: employee.department || "", position: employee.position || "",
    isActive: employee.isActive,
  });

  function update(field: string, value: string) { setForm(p => ({ ...p, [field]: value })); }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isActive: form.isActive }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Employee updated");
      setEditing(false);
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/hr/employees" className="text-muted-foreground hover:text-foreground mt-1"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{employee.firstName} {employee.lastName}</h1>
              <span className="font-mono text-xs text-muted-foreground">{employee.employeeCode}</span>
              {employee.isActive ? <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{employee.position || "—"} • {employee.department || "—"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? <>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
          </> : <Button onClick={() => setEditing(true)}>Edit</Button>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3"><Mail className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-medium">Contact</h3></div>
          {editing ? <>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => update("email", e.target.value)} /></div>
            <div className="space-y-2 mt-2"><Label>Phone</Label><Input value={form.phone} onChange={e => update("phone", e.target.value)} /></div>
          </> : <>
            <p className="text-sm">{employee.email || "—"}</p>
            <p className="text-sm mt-1">{employee.phone || "—"}</p>
          </>}
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-medium">Employment</h3></div>
          {editing ? <>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={e => update("department", e.target.value)} /></div>
            <div className="space-y-2 mt-2"><Label>Position</Label><Input value={form.position} onChange={e => update("position", e.target.value)} /></div>
          </> : <>
            <p className="text-sm">Started {formatDate(employee.startDate)}</p>
            <p className="text-sm mt-1">{employee.department || "—"} • {employee.position || "—"}</p>
          </>}
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3"><DollarSign className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-medium">Compensation</h3></div>
          <p className="text-lg font-bold">{employee.currency?.symbol || "$"}{(employee.basicSalary || 0).toLocaleString("en-ZW")}</p>
          <p className="text-xs text-muted-foreground mt-1">Monthly basic salary • {employee.currency?.code || "USD"}</p>
          {employee.bankName && <p className="text-xs text-muted-foreground mt-2">Bank: {employee.bankName}</p>}
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-sm">Statutory Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div><p className="text-xs text-muted-foreground">PAYE Number</p><p className="text-sm font-mono">{employee.taxIdNumber || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">NSSA Number</p><p className="text-sm font-mono">{employee.nssaNumber || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Bank</p><p className="text-sm">{employee.bankName || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Account</p><p className="text-sm font-mono">{employee.bankAccount || "—"}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
