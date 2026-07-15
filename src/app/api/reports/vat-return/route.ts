import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = searchParams.get("format"); // "json" or "csv"

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Output VAT (sales invoices)
    const outputInvoices = await prisma.salesInvoice.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ["FISCAL", "PAID", "PARTIALLY_PAID"] },
        issueDate: { gte: fromDate, lte: toDate },
      },
      include: {
        currency: { select: { code: true, symbol: true } },
        customer: { select: { name: true, bpNumber: true } },
      },
      orderBy: { issueDate: "asc" },
    });

    // Input VAT (purchase orders — simplified, assumes received POs)
    const inputOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ["RECEIVED", "PARTIALLY_RECEIVED"] },
        orderDate: { gte: fromDate, lte: toDate },
      },
      include: {
        currency: { select: { code: true, symbol: true } },
        supplier: { select: { name: true, bpNumber: true } },
      },
      orderBy: { orderDate: "asc" },
    });

    const totalOutputVat = outputInvoices.reduce(
      (sum, inv) => sum + Number(inv.vatAmount),
      0
    );
    const totalOutputValue = outputInvoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    );

    const result = {
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      outputVat: {
        count: outputInvoices.length,
        totalValue: totalOutputValue,
        totalVat: totalOutputVat,
        invoices: outputInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customer.name,
          customerBP: inv.customer.bpNumber,
          issueDate: inv.issueDate.toISOString(),
          total: Number(inv.total),
          vatAmount: Number(inv.vatAmount),
          vatRate: Number(inv.vatRate),
          currency: inv.currency,
        })),
      },
      inputVat: {
        count: inputOrders.length,
        totalValue: inputOrders.reduce((s, o) => s + Number(o.total), 0),
        totalVat: 0, // Simplified — actual input VAT would need line-item detail
        orders: inputOrders.map((o) => ({
          poNumber: o.poNumber,
          supplierName: o.supplier.name,
          supplierBP: o.supplier.bpNumber,
          orderDate: o.orderDate.toISOString(),
          total: Number(o.total),
          currency: o.currency,
        })),
      },
      summary: {
        outputVatDue: totalOutputVat,
        inputVatDeductible: 0, // Simplified
        netVatDue: totalOutputVat,
      },
    };

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Type",
        "Document #",
        "Customer/Supplier",
        "BP Number",
        "Date",
        "Total",
        "VAT Amount",
      ];
      const rows = [
        headers.join(","),
        ...outputInvoices.map((inv) =>
          [
            "Sales Invoice",
            inv.invoiceNumber,
            `"${inv.customer.name}"`,
            inv.customer.bpNumber || "",
            inv.issueDate.toISOString().split("T")[0],
            Number(inv.total).toFixed(2),
            Number(inv.vatAmount).toFixed(2),
          ].join(",")
        ),
        "",
        `Output VAT Total,,,,"${totalOutputValue.toFixed(2)}","${totalOutputVat.toFixed(2)}"`,
      ];

      return new NextResponse(rows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="vat-return-${fromDate.toISOString().split("T")[0]}-${toDate.toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating VAT return:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
