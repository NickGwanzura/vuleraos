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

    const employee = await prisma.employee.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { currency: { select: { id: true, code: true, symbol: true } } },
    });

    if (!employee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...employee,
      basicSalary: employee.basicSalary ? Number(employee.basicSalary) : null,
      startDate: employee.startDate.toISOString(),
      endDate: employee.endDate?.toISOString() || null,
    });
  } catch (error) {
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

    const existing = await prisma.employee.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName: body.firstName ?? undefined,
        lastName: body.lastName ?? undefined,
        email: body.email !== undefined ? body.email : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        department: body.department !== undefined ? body.department : undefined,
        position: body.position !== undefined ? body.position : undefined,
        basicSalary: body.basicSalary !== undefined ? (body.basicSalary ? Number(body.basicSalary) : null) : undefined,
        currencyId: body.currencyId !== undefined ? body.currencyId : undefined,
        bankName: body.bankName !== undefined ? body.bankName : undefined,
        bankAccount: body.bankAccount !== undefined ? body.bankAccount : undefined,
        taxIdNumber: body.taxIdNumber !== undefined ? body.taxIdNumber : undefined,
        nssaNumber: body.nssaNumber !== undefined ? body.nssaNumber : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
