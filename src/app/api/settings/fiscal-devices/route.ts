import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devices = await prisma.fiscalDevice.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { salesInvoices: true } } },
    });

    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.deviceId || !body.serialNumber || !body.model) {
      return NextResponse.json(
        { error: "deviceId, serialNumber, and model are required" },
        { status: 400 }
      );
    }

    const device = await prisma.fiscalDevice.create({
      data: {
        tenantId: user.tenantId,
        deviceId: body.deviceId,
        serialNumber: body.serialNumber,
        model: body.model,
        status: body.status || "ACTIVE",
        certificate: body.certificate || null,
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Device ID already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
