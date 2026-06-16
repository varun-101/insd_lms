import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email },
          include: {
            memberships: {
              where: { status: { not: "SUSPENDED" }, org: { status: "ACTIVE" } },
              include: { org: { select: { id: true, name: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        const memberships = user.memberships.map((m) => ({
          orgId: m.orgId,
          orgName: m.org.name,
          role: m.role,
        }));

        // Reject normal users with no active organization; platform operators
        // (SUPER_ADMIN) may legitimately have no membership.
        if (!user.platformRole && memberships.length === 0) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl ?? undefined,
          platformRole: user.platformRole,
          memberships,
          orgId: memberships[0]?.orgId ?? null,
          role: memberships[0]?.role ?? null,
        };
      },
    }),
  ],
});
