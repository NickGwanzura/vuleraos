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
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // customer, supplier, both

    const where: any = { tenantId: user.tenantId, isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type === "customer") where.partnerType = { in: ["CUSTOMER", "BOTH"] };
    if (type === "supplier") where.partnerType = { in: ["SUPPLIER", "BOTH"] };

    const customers = await prisma.businessPartner.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        currency: { select: { code: true, symbol: true } },
        _count: { select: { salesInvoices: true, purchaseOrders: true } },
      },
    });

    const serialized = customers.map((c) => ({
      ...c,
      creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const partner = await prisma.businessPartner.create({
      data: {
        tenantId: user.tenantId,
        partnerType: body.partnerType || "CUSTOMER",
        name: body.name,
        bpNumber: body.bpNumber || null,
        tinNumber: body.tinNumber || null,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        creditLimit: body.creditLimit ? Number(body.creditLimit) : null,
        currencyId: body.currencyId || null,
      },
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
