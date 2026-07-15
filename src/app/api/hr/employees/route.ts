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
    const department = searchParams.get("department");
    const active = searchParams.get("active");

    const where: any = { tenantId: user.tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }
    if (department) where.department = department;
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    const employees = await prisma.employee.findMany({
      where,
      include: { currency: { select: { code: true, symbol: true } } },
      orderBy: [{ isActive: "desc" }, { firstName: "asc" }],
    });

    const serialized = employees.map((e) => ({
      ...e,
      basicSalary: e.basicSalary ? Number(e.basicSalary) : null,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() || null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching employees:", error);
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
    if (!body.firstName || !body.lastName || !body.employeeCode) {
      return NextResponse.json({ error: "firstName, lastName, and employeeCode are required" }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        tenantId: user.tenantId,
        employeeCode: body.employeeCode,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        department: body.department || null,
        position: body.position || null,
        basicSalary: body.basicSalary ? Number(body.basicSalary) : null,
        currencyId: body.currencyId || null,
        bankName: body.bankName || null,
        bankAccount: body.bankAccount || null,
        taxIdNumber: body.taxIdNumber || null,
        nssaNumber: body.nssaNumber || null,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Employee code already exists" }, { status: 409 });
    }
    console.error("Error creating employee:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
