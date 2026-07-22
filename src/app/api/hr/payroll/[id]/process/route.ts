import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

/**
 * Submit a draft payroll for approval. Actually posting the accrual happens
 * at approval time (PUT .../status, PENDING_APPROVAL -> PROCESSED), not here
 * — this only flips the status so a distinct approver can review it first.
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
        { error: `Cannot submit a ${run.status.toLowerCase()} payroll for approval` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.payrollRun.update({
        where: { id },
        data: { status: "PENDING_APPROVAL" },
      });

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "status_change",
          entityType: "payroll_run",
          entityId: id,
          changes: { status: "PENDING_APPROVAL", previousStatus: "DRAFT" },
        },
      });

      return updated;
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
