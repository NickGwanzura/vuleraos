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
  CheckCircle,
  XCircle,
  Package,
  Building2,
  Calendar,
  User,
  Truck,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface POItem {
  id: string;
  description: string;
  quantity: number;
  quantityReceived: number;
  unitPrice: number;
  lineTotal: number;
  item: { id: string; name: string; sku: string } | null;
  currencyId: string;
  exchangeRateId: string | null;
  itemId: string | null;
}

interface PO {
  id: string;
  poNumber: string;
  supplier: { id: string; name: string; bpNumber: string | null; email: string | null; phone: string | null };
  currency: { id: string; code: string; symbol: string };
  exchangeRate: { rate: number } | null;
  createdBy: { name: string };
  approvedBy: { name: string } | null;
  items: POItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface PODetailProps {
  po: PO;
}

function getStatusBadge(status: string): string {
  const variants: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200",
    APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200",
    PARTIALLY_RECEIVED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-200",
    RECEIVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200",
    CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  return variants[status] || "bg-muted text-muted-foreground";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
}

export function PODetail({ po }: PODetailProps) {
  const router = useRouter();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [receiveItems, setReceiveItems] = useState<Record<string, number>>({});

  const canReceive = ["APPROVED", "PARTIALLY_RECEIVED"].includes(po.status);
  const canCancel = !["RECEIVED", "CANCELLED"].includes(po.status);

  function getAvailableActions(): { label: string; status: string }[] {
    const actions: Record<string, { label: string; status: string }[]> = {
      DRAFT: [{ label: "Submit for Approval", status: "PENDING_APPROVAL" }, { label: "Cancel", status: "CANCELLED" }],
      PENDING_APPROVAL: [{ label: "Approve", status: "APPROVED" }, { label: "Send Back to Draft", status: "DRAFT" }, { label: "Cancel", status: "CANCELLED" }],
      APPROVED: [{ label: "Cancel", status: "CANCELLED" }],
      PARTIALLY_RECEIVED: [{ label: "Cancel", status: "CANCELLED" }],
    };
    return actions[po.status] || [];
  }

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/buying/purchase-orders/${po.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success(`Order status updated`);
      setStatusDialogOpen(false);
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setUpdating(false); }
  }

  async function handleReceive() {
    const items = Object.entries(receiveItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (items.length === 0) { toast.error("Enter at least one quantity to receive"); return; }

    setUpdating(true);
    try {
      const res = await fetch("/api/buying/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrderId: po.id, items }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed"); return; }
      toast.success("Stock received successfully");
      setReceiveDialogOpen(false);
      setReceiveItems({});
      router.refresh();
    } catch { toast.error("An error occurred"); }
    finally { setUpdating(false); }
  }

  const actions = getAvailableActions();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/buying/purchase-orders" className="text-muted-foreground hover:text-foreground mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{po.poNumber}</h1>
              <Badge variant="outline" className={getStatusBadge(po.status)}>
                {po.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Ordered {formatDate(po.orderDate)}</span>
              {po.expectedDate && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Expected {formatDate(po.expectedDate)}</span>}
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{po.createdBy.name}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canReceive && (
            <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
              <DialogTrigger className="outline-none cursor-pointer">
                <Button variant="outline" size="sm" type="button">
                  <Truck className="h-4 w-4 mr-1" /> Receive Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Receive Stock</DialogTitle>
                  <DialogDescription>Mark items as received for {po.poNumber}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2 max-h-60 overflow-auto">
                  {po.items.map((item) => {
                    const remaining = item.quantity - item.quantityReceived;
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">Ordered: {item.quantity} | Received: {item.quantityReceived} | Remaining: {remaining}</p>
                        </div>
                        <div className="w-24">
                          <Input type="number" min="0" max={remaining} placeholder="0"
                            value={receiveItems[item.id] ?? ""}
                            onChange={(e) => setReceiveItems((p) => ({ ...p, [item.id]: Number(e.target.value) || 0 }))} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleReceive} disabled={updating}>{updating ? "Processing..." : "Receive"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {actions.length > 0 && (
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogTrigger className="outline-none cursor-pointer">
                <Button variant="outline" size="sm" type="button">
                  <CheckCircle className="h-4 w-4 mr-1" /> Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Update Order Status</DialogTitle>
                  <DialogDescription>Change the status of {po.poNumber}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Select action" /></SelectTrigger>
                    <SelectContent>
                      {actions.map((a) => (
                        <SelectItem key={a.status} value={a.status}>{a.label}</SelectItem>
                      ))}
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3"><Building2 className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-medium">Supplier</h3></div>
            <p className="text-sm font-medium">{po.supplier.name}</p>
            {po.supplier.bpNumber && <p className="text-xs text-muted-foreground">BP: {po.supplier.bpNumber}</p>}
            {po.supplier.email && <p className="text-xs text-muted-foreground">{po.supplier.email}</p>}
            {po.supplier.phone && <p className="text-xs text-muted-foreground">{po.supplier.phone}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3"><DollarSign className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-medium">Order Summary</h3></div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{po.currency.symbol}{po.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{po.currency.symbol}{po.total.toFixed(2)}</span></div>
              <div className="pt-2 text-xs text-muted-foreground">Currency: {po.currency.code}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3"><Package className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-medium">Receiving Status</h3></div>
            <div className="space-y-1 text-sm">
              {po.items.map((item) => {
                const remaining = item.quantity - item.quantityReceived;
                const done = remaining <= 0;
                return (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{item.description}</span>
                    <span className={done ? "text-green-600 text-xs" : "text-amber-600 text-xs"}>
                      {item.quantityReceived}/{item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) => {
                const remaining = item.quantity - item.quantityReceived;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.description}</p>
                      {item.item && <p className="text-xs text-muted-foreground">{item.item.sku}</p>}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{po.currency.symbol}{item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{po.currency.symbol}{item.lineTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600">{item.quantityReceived}</TableCell>
                    <TableCell className="text-right">{remaining > 0 ? <span className="text-amber-600">{remaining}</span> : <span className="text-green-600">—</span>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="w-72 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{po.currency.symbol}{po.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-1">
            <span>Total</span>
            <span>{po.currency.symbol}{po.total.toLocaleString("en-ZW", { minimumFractionDigits: 2 })}</span>
          </div>
          {po.notes && (
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground">Notes:</p>
              <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </div>
      </div>

      {po.approvedBy && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Approved by <strong>{po.approvedBy.name}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
