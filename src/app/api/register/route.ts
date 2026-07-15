import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const { email, name, password, tenantName, businessType } =
      await request.json();

    // Validate inputs
    if (!email || !name || !password || !tenantName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create tenant and owner user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          businessType: businessType || "SOLE_TRADER",
        },
      });

      // Create base currencies for the tenant
      await tx.currency.createMany({
        data: [
          {
            tenantId: tenant.id,
            code: "USD",
            symbol: "$",
            name: "US Dollar",
            isBase: true,
            decimalPlaces: 2,
          },
          {
            tenantId: tenant.id,
            code: "ZWG",
            symbol: "ZiG",
            name: "Zimbabwe Gold",
            isBase: false,
            decimalPlaces: 2,
          },
        ],
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name,
          passwordHash,
          role: "OWNER",
          onboardingCompleted: false,
        },
      });

      return { tenant, user };
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        tenantId: result.tenant.id,
        userId: result.user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
