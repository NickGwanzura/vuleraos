"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Shield, UserCheck, UserX, Copy } from "lucide-react";
import Link from "next/link";

interface User {
  id: string; email: string; name: string; role: string;
  isActive: boolean; onboardingCompleted: boolean; createdAt: string;
}

interface UserManagementProps {
  users: User[];
  currentUserId: string;
  currentUserRole: string;
}

function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" }); }

const ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "CASHIER", label: "Cashier" },
  { value: "STAFF", label: "Staff" },
];

export function UserManagement({ users, currentUserId, currentUserRole }: UserManagementProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", role: "STAFF" });

  const isAdmin = ["OWNER", "ADMIN"].includes(currentUserRole);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.name) { toast.error("Email and name are required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      const u = await res.json();
      setTempPassword(u.tempPassword);
      toast.success("User invited");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success(currentActive ? "User deactivated" : "User activated");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  async function handleRoleChange(userId: string, role: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Role updated");
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div><h1 className="text-2xl font-semibold tracking-tight">Users</h1><p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? "s" : ""}</p></div>
        </div>
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) setTempPassword(null); }}>
            <DialogTrigger className="outline-none cursor-pointer"><Button><Plus className="h-4 w-4 mr-1" /> Invite User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite User</DialogTitle><DialogDescription>Add a new user to your business account</DialogDescription></DialogHeader>
              {tempPassword ? (
                <div className="space-y-3 py-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">User invited successfully!</p>
                    <p className="text-xs text-green-700 mt-1">Share the temporary password with the user:</p>
                    <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded border">
                      <code className="text-sm font-mono flex-1">{tempPassword}</code>
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success("Copied"); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 mt-2">They can sign in with their email and this password, then change it.</p>
                  </div>
                  <DialogFooter><Button onClick={() => { setInviteOpen(false); setTempPassword(null); }}>Done</Button></DialogFooter>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-3 py-2">
                  <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
                  <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.co.zw" /></div>
                  <div className="space-y-1"><Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? "STAFF" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <DialogFooter><Button type="submit" disabled={saving}>{saving ? "Inviting..." : "Invite"}</Button></DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card><CardContent className="p-0">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium ${u.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium">{u.name} {u.id === currentUserId && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                <p className="text-xs text-muted-foreground">{u.email} • Joined {formatDate(u.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && u.id !== currentUserId ? (
                <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v ?? u.role)}>
                  <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="text-xs">{ROLES.find((r) => r.value === u.role)?.label || u.role}</Badge>
              )}
              {u.isActive ? <UserCheck className="h-4 w-4 text-green-500" /> : <UserX className="h-4 w-4 text-red-500" />}
              {isAdmin && u.id !== currentUserId && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleActive(u.id, u.isActive)}>
                  {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
