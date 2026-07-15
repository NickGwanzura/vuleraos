import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.skip) {
      // Mark onboarding as completed without changes
      await prisma.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true },
      });
      return NextResponse.json({ success: true });
    }

    // Update tenant with onboarding data
    await prisma.$transaction(async (tx) => {
      // Update tenant settings
      await tx.tenant.update({
        where: { id: user.tenantId },
        data: {
          defaultCurrency: body.defaultCurrency || "USD",
          bpNumber: body.bpNumber || undefined,
        },
      });

      // Mark user onboarding as complete
      await tx.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
