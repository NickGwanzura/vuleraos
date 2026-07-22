"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { BookText } from "lucide-react";
import { toast } from "sonner";

interface JournalEntryRow {
  id: string;
  entryNumber: string;
  entryDate: string;
  memo: string | null;
  sourceType: string;
  status: string;
  postedBy: { name: string };
  lines: { debit: number; currency: { code: string } }[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

export function JournalEntriesList() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntryRow[] | null>(null);

  useEffect(() => {
    fetch("/api/ledger/journal-entries")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setEntries)
      .catch(() => toast.error("Failed to load journal entries"));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Journal Entries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every entry posted to the ledger, most recent first.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries === null ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <BookText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No journal entries yet.</p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const total = entry.lines.reduce((s, l) => s + l.debit, 0);
                  const currencyCode = entry.lines[0]?.currency.code ?? "";
                  return (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/reports/journal-entries/${entry.id}`)}
                    >
                      <TableCell className="font-mono text-xs">{entry.entryNumber}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{formatDate(entry.entryDate)}</TableCell>
                      <TableCell>{entry.memo || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.sourceType.replace("_", " ")}</TableCell>
                      <TableCell className="text-right font-medium">
                        {currencyCode} {total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={entry.status === "REVERSED" ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-800"}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.postedBy.name}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
