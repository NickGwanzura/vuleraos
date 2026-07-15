"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, ArrowUpRight, DollarSign, Clock, Briefcase } from "lucide-react";
import Link from "next/link";

interface RecentEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  department: string | null;
  position: string | null;
  basicSalary: number | null;
  currency: { symbol: string } | null;
}

interface HrWorkspaceProps {
  metrics: { activeEmployees: number; departments: number; pendingPayrolls: number };
  recentEmployees: RecentEmployee[];
}

export function HrWorkspace({ metrics, recentEmployees }: HrWorkspaceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Human Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage employees and payroll.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {metrics.departments} departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.departments}</div>
            <p className="text-xs text-muted-foreground mt-1">Active departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payrolls</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.pendingPayrolls > 0 ? "text-amber-600" : ""}`}>
              {metrics.pendingPayrolls}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/hr/employees/new"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <Plus className="h-4 w-4" /> New Employee
            </Link>
            <Link href="/hr/payroll"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background bg-clip-padding px-2.5 h-8 gap-1.5 text-sm font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <DollarSign className="h-4 w-4" /> Run Payroll
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Payroll Status</CardTitle></CardHeader>
          <CardContent>
            {metrics.pendingPayrolls > 0 ? (
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                <span><strong>{metrics.pendingPayrolls} payroll run(s)</strong> need processing.{" "}
                  <Link href="/hr/payroll" className="text-primary hover:underline">Review now</Link></span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending payrolls. All up to date.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Employees</CardTitle>
          <Link href="/hr/employees"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap hover:bg-muted hover:text-foreground transition-all outline-none select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No employees yet. Add your first employee.</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentEmployees.map((e) => (
                <Link key={e.id} href={`/hr/employees/${e.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-md transition-colors -mx-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.firstName} {e.lastName}</p>
                    <p className="text-xs text-muted-foreground">{e.department || "—"} • {e.position || "—"}</p>
                  </div>
                  <div className="text-right text-sm">
                    {e.basicSalary !== null && (
                      <p className="font-medium">{e.currency?.symbol || "$"}{e.basicSalary.toLocaleString("en-ZW")}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{e.employeeCode}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
