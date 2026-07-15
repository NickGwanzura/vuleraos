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
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"] },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        currency: { select: { code: true, symbol: true } },
      },
      orderBy: { orderDate: "asc" },
    });

    const aging = orders.map((po) => {
      const orderDate = new Date(po.orderDate);
      const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

      let bucket = "current";
      if (daysSinceOrder > 90) bucket = "90+";
      else if (daysSinceOrder > 60) bucket = "61-90";
      else if (daysSinceOrder > 30) bucket = "31-60";
      else if (daysSinceOrder > 0) bucket = "1-30";

      return {
        poId: po.id,
        poNumber: po.poNumber,
        supplier: po.supplier,
        total: Number(po.total),
        orderDate: po.orderDate.toISOString(),
        daysOutstanding: Math.max(0, daysSinceOrder),
        bucket,
        currency: po.currency,
      };
    });

    const buckets = {
      current: { label: "Current", total: 0, count: 0 },
      "1-30": { label: "1-30 days", total: 0, count: 0 },
      "31-60": { label: "31-60 days", total: 0, count: 0 },
      "61-90": { label: "61-90 days", total: 0, count: 0 },
      "90+": { label: "90+ days", total: 0, count: 0 },
    };

    for (const item of aging) {
      if (buckets[item.bucket as keyof typeof buckets]) {
        buckets[item.bucket as keyof typeof buckets].total += item.total;
        buckets[item.bucket as keyof typeof buckets].count += 1;
      }
    }

    return NextResponse.json({
      items: aging,
      summary: Object.values(buckets),
      grandTotal: aging.reduce((sum, i) => sum + i.total, 0),
    });
  } catch (error) {
    console.error("Error fetching AP aging:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
