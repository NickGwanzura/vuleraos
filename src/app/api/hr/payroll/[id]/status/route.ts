import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

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

    const validTransitions: Record<string, string[]> = {
      DRAFT: ["PROCESSED", "CANCELLED"],
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

    const updated = await prisma.payrollRun.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
