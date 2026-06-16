"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/session";
import { unstable_update } from "@/lib/auth";

/**
 * Switch the user's active organization. Verifies the user actually belongs to
 * the target org (from their session memberships), re-issues the JWT via
 * NextAuth, then redirects to the new role's home.
 */
export async function switchActiveOrg(orgId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = user.memberships.find((m) => m.orgId === orgId);
  if (!membership) redirect(homeFor(user));

  await unstable_update({ orgId } as never);

  revalidatePath("/", "layout");
  redirect(`/${membership.role.toLowerCase()}`);
}
