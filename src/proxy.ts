import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Where to send a logged-in user who lands on /login, /dashboard, or the wrong
// area. Returns null when the session has no valid destination (e.g. a stale
// token with a role but no active org) — callers must then let /login render so
// the user can re-authenticate, instead of bouncing in a loop.
function homeFor(
  role?: string | null,
  platformRole?: string | null,
  orgId?: string | null,
): string | null {
  if (role && orgId) return `/${role.toLowerCase()}`;
  if (platformRole === "SUPER_ADMIN") return "/platform";
  return null;
}

// Path prefix -> org role required to access it.
const guarded: Array<{ prefix: string; role: string }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/teacher", role: "TEACHER" },
  { prefix: "/student", role: "STUDENT" },
];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;
  const platformRole = session?.user?.platformRole;
  const orgId = session?.user?.orgId;
  const home = homeFor(role, platformRole, orgId);

  // Authenticated users hitting /login or /dashboard get routed to their home —
  // but only if they have a valid one. A broken/stale session falls through so
  // /login can render and they can sign in again.
  if (
    isLoggedIn &&
    home &&
    (nextUrl.pathname === "/login" || nextUrl.pathname === "/dashboard")
  ) {
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  // Platform console: SUPER_ADMIN only.
  if (nextUrl.pathname.startsWith("/platform")) {
    if (!isLoggedIn) {
      const url = new URL("/login", nextUrl);
      url.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    if (platformRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(home ?? "/login", nextUrl));
    }
    return NextResponse.next();
  }

  // Org areas: require the matching active-org role.
  const match = guarded.find((g) => nextUrl.pathname.startsWith(g.prefix));
  if (match) {
    if (!isLoggedIn) {
      const url = new URL("/login", nextUrl);
      url.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    if (role !== match.role || !orgId) {
      // Wrong area or no active org — send to a valid home, or /login if none.
      return NextResponse.redirect(new URL(home ?? "/login", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
