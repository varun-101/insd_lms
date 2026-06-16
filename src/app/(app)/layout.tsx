import { redirect } from "next/navigation";
import { requireUser, homeFor } from "@/lib/session";
import { navByRole, roleLabel } from "@/lib/nav";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  // The (app) areas require an active org role; platform-only users go elsewhere.
  if (!user.role || !user.orgId) redirect(homeFor(user));

  const activeOrg = user.memberships.find((m) => m.orgId === user.orgId);

  return (
    <AppShell
      user={{ name: user.name ?? "User", email: user.email ?? "" }}
      nav={navByRole[user.role]}
      home={`/${user.role.toLowerCase()}`}
      roleLabel={roleLabel[user.role]}
      orgName={activeOrg?.orgName ?? ""}
      orgs={user.memberships}
      activeOrgId={user.orgId}
    >
      {children}
    </AppShell>
  );
}
