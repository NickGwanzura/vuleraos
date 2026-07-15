"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ArrowUpDown, Users } from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string; employeeCode: string; firstName: string; lastName: string;
  email: string | null; phone: string | null; department: string | null;
  position: string | null; basicSalary: number | null; isActive: boolean;
  startDate: string; currency: { code: string; symbol: string } | null;
}

interface EmployeeListProps { employees: Employee[]; departments: string[] }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

type SortField = "firstName" | "employeeCode" | "department" | "basicSalary";
type SortDir = "asc" | "desc";

export function EmployeeList({ employees, departments }: EmployeeListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("firstName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = [...employees];
    if (search) { const q = search.toLowerCase(); result = result.filter(e => e.firstName.toLowerCase().includes(q) || e.lastName.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || (e.department || "").toLowerCase().includes(q)); }
    if (deptFilter !== "all") result = result.filter(e => e.department === deptFilter);
    if (statusFilter === "active") result = result.filter(e => e.isActive);
    if (statusFilter === "inactive") result = result.filter(e => !e.isActive);
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "firstName": cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`); break;
        case "employeeCode": cmp = a.employeeCode.localeCompare(b.employeeCode); break;
        case "department": cmp = (a.department || "").localeCompare(b.department || ""); break;
        case "basicSalary": cmp = (a.basicSalary || 0) - (b.basicSalary || 0); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [employees, search, deptFilter, statusFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Employees</h1><p className="text-sm text-muted-foreground">{employees.length} employee{employees.length !== 1 ? "s" : ""}</p></div>
        <Link href="/hr/employees/new"><Button><Plus className="h-4 w-4 mr-1" /> New Employee</Button></Link>
      </div>

      <Card><CardContent className="pt-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, code, or department..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
          <Select value={deptFilter} onValueChange={v => setDeptFilter(v ?? "all")}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? "all")}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
        <TableHead className="cursor-pointer" onClick={() => toggleSort("employeeCode")}><div className="flex items-center gap-1">Code <ArrowUpDown className="h-3 w-3" /></div></TableHead>
        <TableHead className="cursor-pointer" onClick={() => toggleSort("firstName")}><div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></div></TableHead>
        <TableHead className="cursor-pointer" onClick={() => toggleSort("department")}><div className="flex items-center gap-1">Department <ArrowUpDown className="h-3 w-3" /></div></TableHead>
        <TableHead>Position</TableHead>
        <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("basicSalary")}><div className="flex items-center justify-end gap-1">Salary <ArrowUpDown className="h-3 w-3" /></div></TableHead>
        <TableHead>Status</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12"><Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">{search || deptFilter !== "all" ? "No employees match your filters." : "No employees yet."}</p></TableCell></TableRow>
        : filtered.map(e => <TableRow key={e.id} className="cursor-pointer" onClick={() => router.push(`/hr/employees/${e.id}`)}>
          <TableCell className="font-mono text-xs">{e.employeeCode}</TableCell>
          <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
          <TableCell>{e.department || "—"}</TableCell>
          <TableCell className="text-muted-foreground">{e.position || "—"}</TableCell>
          <TableCell className="text-right">{e.basicSalary !== null ? `${e.currency?.symbol || "$"}${e.basicSalary.toLocaleString("en-ZW")}` : "—"}</TableCell>
          <TableCell>{e.isActive ? <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge> : <Badge variant="outline" className="bg-gray-100 text-gray-500">Inactive</Badge>}</TableCell>
        </TableRow>)}
      </TableBody></Table></CardContent></Card>
    </div>
  );
}
