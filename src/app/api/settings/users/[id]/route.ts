import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const user = await prisma.user.findFirst({
      where: { id, tenantId: currentUser.tenantId },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can't change your own role or deactivate yourself
    if (id === currentUser.id && body.isActive === false) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
    }
    if (id === currentUser.id && body.role && body.role !== user.role) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: body.role ?? undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        name: body.name ?? undefined,
      },
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
