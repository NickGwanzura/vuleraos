import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma/client";

function getIpFromHeaders(headers?: Headers): string | undefined {
  if (!headers) return undefined;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return headers.get("x-real-ip") ?? undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Account is disabled");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          onboardingCompleted: user.onboardingCompleted,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        token.onboardingCompleted = session.onboardingCompleted;
        return token;
      }
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantName = token.tenantName as string;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id || !(user as any).tenantId) return;
      try {
        await prisma.auditLog.create({
          data: {
            tenantId: (user as any).tenantId,
            userId: user.id,
            action: "sign_in",
            entityType: "user",
            entityId: user.id,
            changes: { email: user.email },
          },
        });
      } catch {
        // Audit logging failure should not block auth
      }
    },
    async signOut(message) {
      // With JWT strategy, the message contains the token
      if ("token" in message && message.token) {
        const token = message.token as any;
        if (!token.id || !token.tenantId) return;
        try {
          await prisma.auditLog.create({
            data: {
              tenantId: token.tenantId,
              userId: token.id,
              action: "sign_out",
              entityType: "user",
              entityId: token.id,
              changes: { email: token.email },
            },
          });
        } catch {
          // Audit logging failure should not block auth
        }
      }
    },
  },
});
