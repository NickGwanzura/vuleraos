"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Search } from "lucide-react";
import { toast } from "sonner";

interface BalanceRow {
  accountId: string;
  code: string;
  name: string;
  currencyCode: string;
  balance: number;
}

interface BalanceSheetData {
  asOf: string;
  assets: BalanceRow[];
  liabilities: BalanceRow[];
  equity: BalanceRow[];
  totals: { assets: number; liabilities: number; equity: number };
}

function fmt(amount: number, currencyCode: string) {
  return `${currencyCode} ${amount.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Section({ title, rows, total }: { title: string; rows: BalanceRow[]; total: number }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No balances.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={`${r.accountId}-${r.currencyCode}`} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.name}</span>
              <span>{fmt(r.balance, r.currencyCode)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between text-sm font-semibold border-t mt-2 pt-2">
        <span>Total {title}</span>
        <span>{total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}

export function BalanceSheetReport() {
  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/balance-sheet?asOf=${asOf}`);
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
        <h1 className="text-2xl font-semibold tracking-tight">Balance Sheet</h1>
        <p className="text-sm text-muted-foreground mt-1">Assets, liabilities, and equity as of a date.</p>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Landmark className="h-4 w-4" /> As of {new Date(data.asOf).toLocaleDateString("en-ZW")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Section title="Assets" rows={data.assets} total={data.totals.assets} />
            <div className="space-y-6">
              <Section title="Liabilities" rows={data.liabilities} total={data.totals.liabilities} />
              <Section title="Equity" rows={data.equity} total={data.totals.equity} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
