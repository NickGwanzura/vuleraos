"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Banknote } from "lucide-react";
import { toast } from "sonner";

interface ExposureRow {
  accountId: string;
  code: string;
  name: string;
  currencyCode: string;
  foreignBalance: number;
  historicalRate: number;
  currentRate: number;
  baseEquivThen: number;
  baseEquivNow: number;
  unrealizedGainLoss: number;
}

interface ExposureData {
  baseCurrency: string;
  rows: ExposureRow[];
}

export function CurrencyExposureReport() {
  const [data, setData] = useState<ExposureData | null>(null);

  useEffect(() => {
    fetch("/api/reports/currency-exposure")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => toast.error("Failed to load currency exposure report"));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Currency Exposure</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Foreign-currency balances translated at today's rate vs. the rate they were posted at.
          Informational only — no journal entry is posted from this report.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Foreign Balance</TableHead>
                <TableHead className="text-right">Rate at Post</TableHead>
                <TableHead className="text-right">Rate Today</TableHead>
                <TableHead className="text-right">{data?.baseCurrency} Then</TableHead>
                <TableHead className="text-right">{data?.baseCurrency} Now</TableHead>
                <TableHead className="text-right">Unrealized G/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data === null ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Banknote className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No foreign-currency exposure.</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.rows.map((row) => (
                  <TableRow key={row.accountId}>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{row.code}</span>
                      {row.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{row.currencyCode}</TableCell>
                    <TableCell className="text-right">
                      {row.currencyCode} {row.foreignBalance.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{row.historicalRate.toFixed(4)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{row.currentRate.toFixed(4)}</TableCell>
                    <TableCell className="text-right">{row.baseEquivThen.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{row.baseEquivNow.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={`text-right font-medium ${row.unrealizedGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {row.unrealizedGainLoss >= 0 ? "+" : ""}
                      {row.unrealizedGainLoss.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
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
