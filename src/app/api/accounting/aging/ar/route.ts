import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const invoices = await prisma.salesInvoice.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ["FISCAL", "PARTIALLY_PAID", "OVERDUE"] },
      },
      include: {
        customer: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const aging = invoices.map((inv) => {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      let bucket = "current";
      if (daysOverdue > 90) bucket = "90+";
      else if (daysOverdue > 60) bucket = "61-90";
      else if (daysOverdue > 30) bucket = "31-60";
      else if (daysOverdue > 0) bucket = "1-30";

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer,
        total: Number(inv.total),
        amountPaid: Number(inv.amountPaid),
        balanceDue: Number(inv.balanceDue),
        dueDate: inv.dueDate.toISOString(),
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
        currency: inv.currency,
      };
    });

    // Group totals by bucket
    const buckets = {
      current: { label: "Current", total: 0, count: 0 },
      "1-30": { label: "1-30 days", total: 0, count: 0 },
      "31-60": { label: "31-60 days", total: 0, count: 0 },
      "61-90": { label: "61-90 days", total: 0, count: 0 },
      "90+": { label: "90+ days", total: 0, count: 0 },
    };

    for (const item of aging) {
      if (buckets[item.bucket as keyof typeof buckets]) {
        buckets[item.bucket as keyof typeof buckets].total += item.balanceDue;
        buckets[item.bucket as keyof typeof buckets].count += 1;
      }
    }

    return NextResponse.json({
      items: aging,
      summary: Object.values(buckets),
      grandTotal: aging.reduce((sum, i) => sum + i.balanceDue, 0),
    });
  } catch (error) {
    console.error("Error fetching AR aging:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
