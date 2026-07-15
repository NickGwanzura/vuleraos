"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeftRight, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  receivedAt: string;
  currency: { code: string; symbol: string };
  invoice: { id: string; invoiceNumber: string; customer: { name: string } } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  total: number;
  balanceDue: number;
  dueDate: string;
  currency: { code: string; symbol: string };
}

interface ReconciliationViewProps {
  unmatchedPayments: Payment[];
  unpaidInvoices: Invoice[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

export function ReconciliationView({ unmatchedPayments, unpaidInvoices }: ReconciliationViewProps) {
  const router = useRouter();
  const [matchDialog, setMatchDialog] = useState<{ payment: Payment | null; invoice: Invoice | null }>({ payment: null, invoice: null });
  const [matching, setMatching] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  async function handleMatch() {
    if (!selectedPayment || !selectedInvoice) {
      toast.error("Select both a payment and an invoice");
      return;
    }

    setMatching(true);
    try {
      const res = await fetch("/api/accounting/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: selectedPayment, invoiceId: selectedInvoice }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Payment matched to invoice");
      setMatchDialog({ payment: null, invoice: null });
      setSelectedPayment(null);
      setSelectedInvoice(null);
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setMatching(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reconciliation</h1>
        <p className="text-sm text-muted-foreground mt-1">Match payments to invoices</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Unmatched Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-500" />
              Unmatched Payments ({unmatchedPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-auto">
            {unmatchedPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All payments are matched.</p>
            ) : (
              unmatchedPayments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayment(p.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedPayment === p.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{p.currency.symbol}{p.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{p.paymentMethod.replace("_", " ")}</p>
                      {p.referenceNumber && (
                        <p className="text-xs text-muted-foreground font-mono">Ref: {p.referenceNumber}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(p.receivedAt)}</p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Unpaid Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Unpaid Invoices ({unpaidInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-auto">
            {unpaidInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No unpaid invoices.</p>
            ) : (
              unpaidInvoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelectedInvoice(inv.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedInvoice === inv.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-600">{inv.currency.symbol}{inv.balanceDue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Match button */}
      {selectedPayment && selectedInvoice && (
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-4 text-center">
              <p className="text-sm mb-3">
                Match the selected payment to the selected invoice?
              </p>
              <Button onClick={handleMatch} disabled={matching}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {matching ? "Matching..." : "Confirm Match"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedPayment && !selectedInvoice && unmatchedPayments.length > 0 && unpaidInvoices.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Select a payment from the left and an invoice from the right to match them.
        </div>
      )}
    </div>
  );
}
