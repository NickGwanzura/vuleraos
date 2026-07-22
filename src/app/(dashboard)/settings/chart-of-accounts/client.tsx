"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Building2, DollarSign, Printer, FileText, Landmark } from "lucide-react";
import { toast } from "sonner";

interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  isSystemAccount: boolean;
  isActive: boolean;
}

const TYPE_ORDER = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

export function ChartOfAccountsSettings() {
  const [accounts, setAccounts] = useState<LedgerAccount[] | null>(null);

  useEffect(() => {
    fetch("/api/ledger/accounts")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setAccounts)
      .catch(() => toast.error("Failed to load chart of accounts"));
  }, []);

  const tabs = [
    { label: "General", href: "/settings", icon: Building2 },
    { label: "Currency", href: "/settings/currency", icon: DollarSign },
    { label: "Fiscal Devices", href: "/settings/fiscal-devices", icon: Printer },
    { label: "Documents", href: "/settings/documents", icon: FileText },
    { label: "Chart of Accounts", href: "/settings/chart-of-accounts", icon: Landmark, active: true },
  ];

  const sorted = accounts
    ? [...accounts].sort(
        (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.code.localeCompare(b.code)
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            The accounts postings from invoices, payments, purchase orders, and payroll are made to.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
                t.active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted === null ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-sm text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-xs">{account.code}</TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{account.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={account.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
