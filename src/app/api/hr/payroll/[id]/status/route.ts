import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import {
  postPayrollAccrual,
  postPayrollSettlement,
  reversePayrollPostings,
} from "@/lib/ledger/postings";

const APPROVER_ROLES = ["OWNER", "ADMIN", "ACCOUNTANT"];

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
    const { status } = body;

    // DRAFT -> PENDING_APPROVAL happens via PUT .../process. This endpoint
    // only handles the approval itself onward.
    const validTransitions: Record<string, string[]> = {
      PENDING_APPROVAL: ["PROCESSED", "CANCELLED"],
      PROCESSED: ["PAID", "CANCELLED"],
    };

    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId: user.tenantId },
    });

    if (!run) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!validTransitions[run.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${run.status} to ${status}` },
        { status: 400 }
      );
    }

    if (status === "PROCESSED") {
      if (!APPROVER_ROLES.includes(user.role)) {
        return NextResponse.json(
          { error: "Only an owner, admin, or accountant can approve payroll." },
          { status: 403 }
        );
      }
      if (user.id === run.processedById) {
        return NextResponse.json(
          { error: "Payroll must be approved by someone other than whoever ran it." },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.payrollRun.update({
        where: { id },
        data: status === "PROCESSED" ? { status, approvedById: user.id } : { status },
      });

      if (status === "PROCESSED") {
        await postPayrollAccrual(tx, updated, user.id);
      } else if (status === "PAID") {
        await postPayrollSettlement(tx, updated, user.id);
      } else if (status === "CANCELLED") {
        await reversePayrollPostings(tx, {
          tenantId: user.tenantId,
          payrollRunId: id,
          postedById: user.id,
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "status_change",
          entityType: "payroll_run",
          entityId: id,
          changes: { status, previousStatus: run.status },
        },
      });

      return updated;
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
