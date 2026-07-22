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

    const changingAccountingControls =
      body.periodLockDate !== undefined || body.poApprovalThreshold !== undefined;
    if (changingAccountingControls && !["OWNER", "ACCOUNTANT"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only an owner or accountant can change the period lock date or approval threshold." },
        { status: 403 }
      );
    }

    const tenant = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: body.name ?? undefined,
        businessType: body.businessType ?? undefined,
        bpNumber: body.bpNumber !== undefined ? body.bpNumber : undefined,
        registrationNumber: body.registrationNumber !== undefined ? body.registrationNumber : undefined,
        defaultCurrency: body.defaultCurrency ?? undefined,
        periodLockDate:
          body.periodLockDate !== undefined
            ? body.periodLockDate
              ? new Date(body.periodLockDate)
              : null
            : undefined,
        poApprovalThreshold:
          body.poApprovalThreshold !== undefined
            ? body.poApprovalThreshold === null || body.poApprovalThreshold === ""
              ? null
              : Number(body.poApprovalThreshold)
            : undefined,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
