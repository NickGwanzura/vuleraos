import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const partner = await prisma.businessPartner.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { currency: { select: { code: true, symbol: true } } },
    });

    if (!partner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...partner,
      creditLimit: partner.creditLimit ? Number(partner.creditLimit) : null,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.businessPartner.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const partner = await prisma.businessPartner.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        bpNumber: body.bpNumber !== undefined ? body.bpNumber : undefined,
        tinNumber: body.tinNumber !== undefined ? body.tinNumber : undefined,
        contactPerson: body.contactPerson !== undefined ? body.contactPerson : undefined,
        email: body.email !== undefined ? body.email : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        address: body.address !== undefined ? body.address : undefined,
        city: body.city !== undefined ? body.city : undefined,
        creditLimit: body.creditLimit !== undefined ? (body.creditLimit ? Number(body.creditLimit) : null) : undefined,
      },
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
