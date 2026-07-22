import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const entries = await prisma.journalEntry.findMany({
      where: { tenantId: user.tenantId },
      include: {
        postedBy: { select: { name: true } },
        lines: {
          include: {
            account: { select: { code: true, name: true } },
            currency: { select: { code: true, symbol: true } },
          },
        },
      },
      orderBy: { entryDate: "desc" },
      take: limit,
    });

    const serialized = entries.map((e) => ({
      ...e,
      lines: e.lines.map((l) => ({
        ...l,
        debit: Number(l.debit),
        credit: Number(l.credit),
      })),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
