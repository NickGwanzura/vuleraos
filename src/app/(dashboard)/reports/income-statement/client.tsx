"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";

interface IncomeRow {
  accountId: string;
  code: string;
  name: string;
  currencyCode: string;
  balance: number;
}

interface IncomeStatementData {
  period: { from: string; to: string };
  income: IncomeRow[];
  expenses: IncomeRow[];
  totals: { income: number; expenses: number; netIncome: number };
}

export function IncomeStatementReport() {
  const [from, setFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/income-statement?from=${from}&to=${to}`);
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Income Statement</h1>
        <p className="text-sm text-muted-foreground mt-1">Income and expenses between two dates.</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[180px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[180px]" />
            </div>
            <Button onClick={loadReport} disabled={loading}>
              <Search className="h-4 w-4 mr-1" />
              {loading ? "Loading..." : "Run report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {new Date(data.period.from).toLocaleDateString("en-ZW")} — {new Date(data.period.to).toLocaleDateString("en-ZW")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Income</h3>
              {data.income.length === 0 ? (
                <p className="text-sm text-muted-foreground">No income posted.</p>
              ) : (
                <div className="space-y-1">
                  {data.income.map((r) => (
                    <div key={`${r.accountId}-${r.currencyCode}`} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{r.name}</span>
                      <span>{r.currencyCode} {r.balance.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t mt-2 pt-2">
                <span>Total Income</span>
                <span>{data.totals.income.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Expenses</h3>
              {data.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses posted.</p>
              ) : (
                <div className="space-y-1">
                  {data.expenses.map((r) => (
                    <div key={`${r.accountId}-${r.currencyCode}`} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{r.name}</span>
                      <span>{r.currencyCode} {r.balance.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t mt-2 pt-2">
                <span>Total Expenses</span>
                <span>{data.totals.expenses.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold border-t pt-3">
              <span>Net Income</span>
              <span className={data.totals.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                {data.totals.netIncome.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
