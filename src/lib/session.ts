import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

/** Returns the current session user or null. */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Requires an authenticated user; redirects to /login otherwise. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Where to send a user after login / when they hit the wrong area. */
export function homeFor(user: {
  platformRole: string | null;
  role: Role | null;
  orgId: string | null;
}): string {
  // A role home is only valid with an active org; otherwise the area's own
  // guard would redirect right back here, causing a loop.
  if (user.role && user.orgId) return `/${user.role.toLowerCase()}`;
  if (user.platformRole) return "/platform";
  return "/login";
}

/**
 * Requires the user to have one of the given roles **in their active org**.
 * Redirects to their own home if authenticated but unauthorized, or to /login
 * if not authenticated. The returned object guarantees a non-null `orgId`.
 */
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!user.orgId || !user.role || !roles.includes(user.role)) {
    redirect(homeFor(user));
  }
  return { ...user, orgId: user.orgId!, role: user.role! };
}

/**
 * Requires an active organization (any org role). Returns the user with a
 * guaranteed non-null `orgId`.
 */
export async function requireOrg() {
  const user = await requireUser();
  if (!user.orgId) redirect(homeFor(user));
  return { ...user, orgId: user.orgId! };
}

/** Requires the platform-level SUPER_ADMIN role. */
export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (user.platformRole !== "SUPER_ADMIN") redirect(homeFor(user));
  return user;
}

export const roleHome = (role: Role) => `/${role.toLowerCase()}`;
