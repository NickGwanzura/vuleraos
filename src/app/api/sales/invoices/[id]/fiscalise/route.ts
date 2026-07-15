import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.salesInvoice.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        customer: true,
        tenant: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Cannot fiscalise a ${invoice.status.toLowerCase()} invoice` },
        { status: 400 }
      );
    }

    // Validate customer has BP number for ZIMRA compliance
    if (!invoice.customer.bpNumber) {
      return NextResponse.json(
        {
          error:
            "Customer must have a BP/VAT number (BP Number) before issuing a fiscal invoice. Update the customer record first.",
        },
        { status: 400 }
      );
    }

    // Check tenant has a BP number
    if (!invoice.tenant.bpNumber) {
      return NextResponse.json(
        {
          error:
            "Your business must have a BP/VAT number set in Settings before issuing fiscal invoices.",
        },
        { status: 400 }
      );
    }

    // Generate fiscal receipt number
    const year = new Date().getFullYear();
    const fiscalCount = await prisma.salesInvoice.count({
      where: {
        tenantId: user.tenantId,
        isFiscalised: true,
        fiscalReceiptNumber: { startsWith: `F${year}` },
      },
    });

    const fiscalReceiptNumber = `F${year}-${String(fiscalCount + 1).padStart(6, "0")}`;

    // Mark as fiscalised
    const updated = await prisma.salesInvoice.update({
      where: { id },
      data: {
        status: "FISCAL",
        isFiscalised: true,
        fiscalReceiptNumber,
      },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "fiscalise",
        entityType: "sales_invoice",
        entityId: id,
        changes: {
          status: "FISCAL",
          fiscalReceiptNumber,
          previousStatus: invoice.status,
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      isFiscalised: true,
      fiscalReceiptNumber,
    });
  } catch (error) {
    console.error("Error fiscalising invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
