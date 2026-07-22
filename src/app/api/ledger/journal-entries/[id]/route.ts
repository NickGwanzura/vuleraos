import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        postedBy: { select: { name: true } },
        reversalOf: { select: { id: true, entryNumber: true } },
        reversedBy: { select: { id: true, entryNumber: true } },
        lines: {
          include: {
            account: { select: { code: true, name: true } },
            currency: { select: { code: true, symbol: true } },
            businessPartner: { select: { name: true } },
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...entry,
      lines: entry.lines.map((l) => ({
        ...l,
        debit: Number(l.debit),
        credit: Number(l.credit),
      })),
    });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
