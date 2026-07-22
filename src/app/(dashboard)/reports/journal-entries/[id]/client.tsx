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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface JournalEntryLine {
  id: string;
  debit: number;
  credit: number;
  description: string | null;
  account: { code: string; name: string };
  currency: { code: string; symbol: string };
  businessPartner: { name: string } | null;
}

interface JournalEntryData {
  id: string;
  entryNumber: string;
  entryDate: string;
  memo: string | null;
  sourceType: string;
  status: string;
  postedBy: { name: string };
  reversalOf: { id: string; entryNumber: string } | null;
  reversedBy: { id: string; entryNumber: string }[];
  lines: JournalEntryLine[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

export function JournalEntryDetail({ id }: { id: string }) {
  const [entry, setEntry] = useState<JournalEntryData | null>(null);

  useEffect(() => {
    fetch(`/api/ledger/journal-entries/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setEntry)
      .catch(() => toast.error("Failed to load journal entry"));
  }, [id]);

  if (!entry) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/reports/journal-entries" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-mono">{entry.entryNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">{entry.memo || "No memo"}</p>
        </div>
        <Badge
          variant="outline"
          className={entry.status === "REVERSED" ? "bg-gray-100 text-gray-500 ml-auto" : "bg-green-100 text-green-800 ml-auto"}
        >
          {entry.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-4 grid gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Date</p>
            <p>{formatDate(entry.entryDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Source</p>
            <p>{entry.sourceType.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Posted by</p>
            <p>{entry.postedBy.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Reversal</p>
            {entry.reversalOf ? (
              <Link href={`/reports/journal-entries/${entry.reversalOf.id}`} className="text-primary hover:underline font-mono text-xs">
                Reverses {entry.reversalOf.entryNumber}
              </Link>
            ) : entry.reversedBy.length > 0 ? (
              <Link href={`/reports/journal-entries/${entry.reversedBy[0].id}`} className="text-primary hover:underline font-mono text-xs">
                Reversed by {entry.reversedBy[0].entryNumber}
              </Link>
            ) : (
              <p>—</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Business Partner</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{line.account.code}</span>
                    {line.account.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{line.businessPartner?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{line.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    {line.debit > 0 ? `${line.currency.code} ${line.debit.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {line.credit > 0 ? `${line.currency.code} ${line.credit.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold border-t-2">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{totalDebit.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">{totalCredit.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
