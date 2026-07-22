import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.ledgerAccount.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { code: "asc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
