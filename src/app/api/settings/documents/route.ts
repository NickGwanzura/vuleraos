import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

// For simplicity, store letterhead config in the first document_template record
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const template = await prisma.documentTemplate.findFirst({
      where: { tenantId: user.tenantId, type: "invoice" },
    });

    return NextResponse.json(template || { id: null, name: "Default", type: "invoice", content: {} });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const existing = await prisma.documentTemplate.findFirst({
      where: { tenantId: user.tenantId, type: "invoice" },
    });

    const template = existing
      ? await prisma.documentTemplate.update({
          where: { id: existing.id },
          data: { content: body.content, isDefault: body.isDefault ?? true },
        })
      : await prisma.documentTemplate.create({
          data: {
            tenantId: user.tenantId,
            name: body.name || "Default Invoice Layout",
            type: "invoice",
            content: body.content || {},
            isDefault: true,
          },
        });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error saving document template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
