import type { Role, PlatformRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/** A user's organization membership, carried in the session for the org switcher. */
export type SessionMembership = {
  orgId: string;
  orgName: string;
  role: Role;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      platformRole: PlatformRole | null;
      // Active organization context (null for platform-only users like SUPER_ADMIN).
      orgId: string | null;
      role: Role | null;
      memberships: SessionMembership[];
    } & DefaultSession["user"];
  }

  interface User {
    platformRole?: PlatformRole | null;
    orgId?: string | null;
    role?: Role | null;
    memberships?: SessionMembership[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    platformRole: PlatformRole | null;
    orgId: string | null;
    role: Role | null;
    memberships: SessionMembership[];
  }
}
