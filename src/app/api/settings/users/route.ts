import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        onboardingCompleted: true, createdAt: true, image: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const serialized = users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only OWNER and ADMIN can invite users
    if (!["OWNER", "ADMIN"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.email || !body.name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Generate temp password
    const tempPassword = Math.random().toString(36).slice(-10) + "1A!";
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const newUser = await prisma.user.create({
      data: {
        tenantId: currentUser.tenantId,
        email: body.email,
        name: body.name,
        passwordHash,
        role: body.role || "STAFF",
        onboardingCompleted: true, // Skip onboarding for invited users
      },
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        onboardingCompleted: true, createdAt: true,
      },
    });

    return NextResponse.json(
      { ...newUser, createdAt: newUser.createdAt.toISOString(), tempPassword },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists in this tenant" }, { status: 409 });
    }
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
