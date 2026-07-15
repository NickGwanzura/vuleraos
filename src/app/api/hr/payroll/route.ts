import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import { calculatePayrollDeductions } from "@/lib/tax";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const runs = await prisma.payrollRun.findMany({
      where: { tenantId: user.tenantId },
      include: {
        currency: { select: { code: true, symbol: true } },
        processedBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = runs.map((r) => ({
      ...r,
      totalGross: Number(r.totalGross),
      totalDeductions: Number(r.totalDeductions),
      totalNet: Number(r.totalNet),
      totalPaye: Number(r.totalPaye),
      totalNssa: Number(r.totalNssa),
      totalNec: Number(r.totalNec),
      totalAid: Number(r.totalAid),
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
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

    // Default period: previous month
    const now = new Date();
    const periodStart = body.periodStart
      ? new Date(body.periodStart)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = body.periodEnd
      ? new Date(body.periodEnd)
      : new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      include: { currency: { select: { id: true, code: true, symbol: true } } },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: "No active employees found to run payroll" },
        { status: 400 }
      );
    }

    // Determine currency — default from first employee or body
    const defaultCurrency = await prisma.currency.findFirst({
      where: { tenantId: user.tenantId, isBase: true },
    });

    // Create payroll run with all items
    const payrollRun = await prisma.$transaction(async (tx) => {
      let totalGross = 0;
      let totalPaye = 0;
      let totalNssa = 0;
      let totalNec = 0;
      let totalAid = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const items = [];

      for (const emp of employees) {
        const gross = Number(emp.basicSalary) || 0;
        const deductions = calculatePayrollDeductions(gross);

        totalGross += gross;
        totalPaye += deductions.payeTax;
        totalNssa += deductions.nssaDeduction;
        totalNec += deductions.necDeduction;
        totalAid += deductions.aidDeduction;
        totalDeductions += deductions.totalDeductions;
        totalNet += deductions.netPay;

        items.push({
          tenantId: user.tenantId,
          employeeId: emp.id,
          grossPay: gross,
          payeTax: deductions.payeTax,
          nssaDeduction: deductions.nssaDeduction,
          necDeduction: deductions.necDeduction,
          aidDeduction: deductions.aidDeduction,
          otherDeductions: deductions.otherDeductions,
          totalDeductions: deductions.totalDeductions,
          netPay: deductions.netPay,
          currencyId: emp.currencyId || defaultCurrency?.id || "",
        });
      }

      const run = await tx.payrollRun.create({
        data: {
          tenantId: user.tenantId,
          periodStart,
          periodEnd,
          status: "DRAFT",
          totalGross: Math.round(totalGross * 100) / 100,
          totalDeductions: Math.round(totalDeductions * 100) / 100,
          totalNet: Math.round(totalNet * 100) / 100,
          totalPaye: Math.round(totalPaye * 100) / 100,
          totalNssa: Math.round(totalNssa * 100) / 100,
          totalNec: Math.round(totalNec * 100) / 100,
          totalAid: Math.round(totalAid * 100) / 100,
          currencyId: defaultCurrency?.id || "",
          processedById: user.id,
          notes: body.notes || null,
          items: { create: items },
        },
        include: {
          currency: { select: { code: true, symbol: true } },
          processedBy: { select: { name: true } },
          items: {
            include: {
              employee: { select: { firstName: true, lastName: true, employeeCode: true } },
              currency: { select: { code: true, symbol: true } },
            },
          },
        },
      });

      return run;
    });

    return NextResponse.json(
      {
        ...payrollRun,
        totalGross: Number(payrollRun.totalGross),
        totalDeductions: Number(payrollRun.totalDeductions),
        totalNet: Number(payrollRun.totalNet),
        totalPaye: Number(payrollRun.totalPaye),
        totalNssa: Number(payrollRun.totalNssa),
        totalNec: Number(payrollRun.totalNec),
        totalAid: Number(payrollRun.totalAid),
        periodStart: payrollRun.periodStart.toISOString(),
        periodEnd: payrollRun.periodEnd.toISOString(),
        items: payrollRun.items.map((item) => ({
          ...item,
          grossPay: Number(item.grossPay),
          payeTax: Number(item.payeTax),
          nssaDeduction: Number(item.nssaDeduction),
          necDeduction: Number(item.necDeduction),
          aidDeduction: Number(item.aidDeduction),
          otherDeductions: Number(item.otherDeductions),
          totalDeductions: Number(item.totalDeductions),
          netPay: Number(item.netPay),
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error running payroll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
