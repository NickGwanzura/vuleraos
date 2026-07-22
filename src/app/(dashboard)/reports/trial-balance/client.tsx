"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Scale, Search } from "lucide-react";
import { toast } from "sonner";

interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string;
  currencyCode: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  asOf: string;
  rows: TrialBalanceRow[];
  totals: { debit: number; credit: number };
}

function fmt(amount: number, currencyCode: string) {
  return `${currencyCode} ${amount.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TrialBalanceReport() {
  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/trial-balance?asOf=${asOf}`);
      if (!res.ok) {
        toast.error("Failed to load report");
        return;
      }
      setData(await res.json());
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const balanced = data ? Math.abs(data.totals.debit - data.totals.credit) < 0.005 : true;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trial Balance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every posted debit and credit, as of a given date. Should always balance.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asOf">As of</Label>
              <Input
                id="asOf"
                type="date"
                value={asOf}
                onChange={(e) => setAsOf(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <Button onClick={loadReport} disabled={loading}>
              <Search className="h-4 w-4 mr-1" />
              {loading ? "Loading..." : "Run report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="h-4 w-4" />
                {balanced ? "Balanced" : "Out of balance — check postings"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-8 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total debits</p>
                <p className="font-medium">{data.totals.debit.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total credits</p>
                <p className="font-medium">{data.totals.credit.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Scale className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No postings as of this date.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.rows.map((row) => (
                      <TableRow key={`${row.accountId}-${row.currencyCode}`}>
                        <TableCell className="font-mono text-xs">{row.code}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.type}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.currencyCode}</TableCell>
                        <TableCell className="text-right">
                          {row.debit > 0 ? fmt(row.debit, row.currencyCode) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.credit > 0 ? fmt(row.credit, row.currencyCode) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
