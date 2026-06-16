import type { NextAuthConfig } from "next-auth";
import type { Role, PlatformRole } from "@prisma/client";
import type { SessionMembership } from "@/types/next-auth";

/**
 * Edge-safe base config (no database / bcrypt access).
 * Imported by both the full auth instance and the proxy (middleware).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [], // real providers are added in src/lib/auth.ts (Node runtime)
  callbacks: {
    jwt({ token, user, trigger, session }) {
      // Initial sign-in: copy identity + memberships from the authorized user
      // and default the active org to the first membership (if any).
      if (user) {
        const memberships = (user.memberships ?? []) as SessionMembership[];
        const active = memberships[0] ?? null;
        token.id = user.id as string;
        token.platformRole = (user.platformRole ?? null) as PlatformRole | null;
        token.memberships = memberships;
        token.orgId = user.orgId ?? active?.orgId ?? null;
        token.role = (user.role as Role | null | undefined) ?? active?.role ?? null;
      }

      // Org switch: switchActiveOrg() calls update({ orgId }). Re-point the
      // active org/role from the membership list (never trust the client blindly).
      const nextOrgId = (session as { orgId?: string } | null)?.orgId;
      if (trigger === "update" && nextOrgId) {
        const memberships = (token.memberships as SessionMembership[] | undefined) ?? [];
        const match = memberships.find((m) => m.orgId === nextOrgId);
        if (match) {
          token.orgId = match.orgId;
          token.role = match.role;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.platformRole = (token.platformRole as PlatformRole | null) ?? null;
        session.user.orgId = (token.orgId as string | null) ?? null;
        session.user.role = (token.role as Role | null) ?? null;
        session.user.memberships = (token.memberships as SessionMembership[] | undefined) ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
