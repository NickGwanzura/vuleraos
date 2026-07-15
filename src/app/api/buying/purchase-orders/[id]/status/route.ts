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
      DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
      PENDING_APPROVAL: ["APPROVED", "DRAFT", "CANCELLED"],
      APPROVED: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
      PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
    };

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!po) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!validTransitions[po.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${po.status} to ${status}` },
        { status: 400 }
      );
    }

    const updateData: any = { status };

    // If approving, record who approved
    if (status === "APPROVED") {
      updateData.approvedById = user.id;
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error updating PO status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
