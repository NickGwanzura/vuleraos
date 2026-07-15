import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        _count: { select: { users: true } },
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: body.name ?? undefined,
        businessType: body.businessType ?? undefined,
        bpNumber: body.bpNumber !== undefined ? body.bpNumber : undefined,
        registrationNumber: body.registrationNumber !== undefined ? body.registrationNumber : undefined,
        defaultCurrency: body.defaultCurrency ?? undefined,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
