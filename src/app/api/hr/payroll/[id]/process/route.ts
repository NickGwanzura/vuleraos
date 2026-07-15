import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

/**
 * Process a draft payroll: recalculate all deductions and mark as PROCESSED.
 */
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

    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { items: true },
    });

    if (!run) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (run.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Cannot process a ${run.status.toLowerCase()} payroll` },
        { status: 400 }
      );
    }

    const updated = await prisma.payrollRun.update({
      where: { id },
      data: { status: "PROCESSED" },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
