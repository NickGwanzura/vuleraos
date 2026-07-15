"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  XCircle,
  DollarSign,
  ArrowUpRight,
  Building2,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDocumentHTML, openPrintWindow } from "@/lib/print";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
  item: { id: string; name: string; sku: string } | null;
  currency: { code: string; symbol: string } | null;
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  isReconciled: boolean;
  receivedAt: string;
  createdBy: { name: string };
  currency: { code: string; symbol: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    bpNumber: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
  };
  currency: { id: string; code: string; symbol: string };
  exchangeRate: { rate: number; parallelMarketRate: number | null } | null;
  createdBy: { id: string; name: string };
  items: InvoiceItem[];
  payments: Payment[];
  subtotal: number;
  vatAmount: number;
  vatRate: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  isFiscalised: boolean;
  fiscalReceiptNumber: string | null;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceDetailProps {
  invoice: Invoice;
}

function getStatusBadge(status: string): string {
  const variants: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    FISCAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return variants[status] || "bg-muted text-muted-foreground";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handlePrint(invoice: Invoice) {
  const html = formatDocumentHTML(
    "INVOICE",
    invoice.invoiceNumber,
    {
      businessName: "",
      bpNumber: null,
      address: null,
      city: null,
      phone: null,
      email: null,
      primaryColor: "#1e40af",
    },
    {
      label: "Bill To",
      name: invoice.customer.name,
      bp: invoice.customer.bpNumber,
      email: invoice.customer.email,
      phone: invoice.customer.phone,
      address: invoice.customer.address,
      city: invoice.customer.city,
    },
    invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.lineTotal,
    })),
    {
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      vatRate: invoice.vatRate,
      total: invoice.total,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      currencySymbol: invoice.currency.symbol,
    },
    {
      date: formatDate(invoice.issueDate),
      dueDate: formatDate(invoice.dueDate),
      notes: invoice.notes,
    }
  );
  openPrintWindow(html);
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const canEdit = !["PAID", "CANCELLED"].includes(invoice.status);
  const isOverdue = invoice.status !== "PAID" && invoice.status !== "CANCELLED" &&
    new Date(invoice.dueDate) < new Date();

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/sales/invoices/${invoice.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
        return;
      }
      toast.success(`Invoice marked as ${newStatus.replace("_", " ")}`);
      setStatusDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/sales/invoices" className="text-muted-foreground hover:text-foreground mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <Badge variant="outline" className={getStatusBadge(invoice.status)}>
                {invoice.status.replace("_", " ")}
              </Badge>
              {isOverdue && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  OVERDUE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Issued {formatDate(invoice.issueDate)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Due {formatDate(invoice.dueDate)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {invoice.createdBy.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePrint(invoice)}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          {canEdit && (
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger className="outline-none cursor-pointer">
                <Button variant="outline" size="sm" type="button">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Invoice Status</DialogTitle>
                  <DialogDescription>
                    Change the status of {invoice.invoiceNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISCAL">Fiscal (Issue Invoice)</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleStatusUpdate} disabled={!newStatus || updating}>
                    {updating ? "Updating..." : "Confirm"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Customer</h3>
            </div>
            <p className="text-sm font-medium">{invoice.customer.name}</p>
            {invoice.customer.bpNumber && (
              <p className="text-xs text-muted-foreground">BP: {invoice.customer.bpNumber}</p>
            )}
            {invoice.customer.email && (
              <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
            )}
            {invoice.customer.phone && (
              <p className="text-xs text-muted-foreground">{invoice.customer.phone}</p>
            )}
            {invoice.customer.city && (
              <p className="text-xs text-muted-foreground">{invoice.customer.city}</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Payment Summary</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">
                  {invoice.currency.symbol}{invoice.total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-green-600">
                  {invoice.currency.symbol}{invoice.amountPaid.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Balance Due</span>
                <span className={invoice.balanceDue > 0 ? "text-amber-600" : "text-green-600"}>
                  {invoice.currency.symbol}{invoice.balanceDue.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency / Exchange Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Exchange Rate</h3>
            </div>
            <p className="text-sm">
              Currency: <strong>{invoice.currency.code} ({invoice.currency.symbol})</strong>
            </p>
            {invoice.exchangeRate && (
              <div className="text-xs text-muted-foreground mt-1">
                <p>Rate: {Number(invoice.exchangeRate.rate).toFixed(4)}</p>
                {invoice.exchangeRate.parallelMarketRate && (
                  <p>Parallel: {Number(invoice.exchangeRate.parallelMarketRate).toFixed(4)}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">VAT %</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.description}</p>
                    {item.item && (
                      <p className="text-xs text-muted-foreground">{item.item.sku}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {invoice.currency.symbol}{item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{item.vatRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    {invoice.currency.symbol}{item.lineTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{invoice.currency.symbol}{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({invoice.vatRate}%)</span>
            <span>{invoice.currency.symbol}{invoice.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-1">
            <span>Total</span>
            <span>{invoice.currency.symbol}{invoice.total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</span>
          </div>
          {invoice.notes && (
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground">Notes:</p>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-medium">Payment History</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(p.receivedAt)}
                    </TableCell>
                    <TableCell>{p.paymentMethod.replace("_", " ")}</TableCell>
                    <TableCell className="text-xs font-mono">{p.referenceNumber || "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {p.currency.symbol}{p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.isReconciled ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {p.isReconciled ? "Reconciled" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.createdBy.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Fiscal Info */}
      {invoice.isFiscalised && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>Fiscalised</strong> — Receipt #: {invoice.fiscalReceiptNumber || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
