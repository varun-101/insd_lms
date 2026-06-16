import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session";
import { fromNow } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IntegrationsForm } from "@/components/platform/integrations-form";
import { InviteAdminDialog } from "@/components/platform/invite-admin-dialog";
import { OrgStatusButton } from "@/components/platform/org-status-button";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  await requirePlatformAdmin();
  const { orgId } = await params;

  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      memberships: {
        where: { role: "ADMIN" },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!org) notFound();

  return (
    <div className="space-y-7">
      <Link
        href="/platform"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All organizations
      </Link>

      <PageHeader
        title={org.name}
        description={`/${org.slug}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={org.status === "ACTIVE" ? "secondary" : "outline"}>
              {org.status.toLowerCase()}
            </Badge>
            <OrgStatusButton orgId={org.id} status={org.status} />
          </div>
        }
      />

      {/* Admins */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" /> Administrators
            </CardTitle>
            <CardDescription>People who can manage this organization.</CardDescription>
          </div>
          <InviteAdminDialog orgId={org.id} />
        </CardHeader>
        <CardContent>
          {org.memberships.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No administrators yet. Invite the first admin to onboard this org.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {org.memberships.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{fromNow(m.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Integrations */}
      <IntegrationsForm
        org={{
          id: org.id,
          zoomAccountId: org.zoomAccountId,
          zoomClientId: org.zoomClientId,
          hasZoomSecret: !!org.zoomClientSecretEnc,
          hasZoomWebhookSecret: !!org.zoomWebhookSecretEnc,
          s3Endpoint: org.s3Endpoint,
          s3Region: org.s3Region,
          s3Bucket: org.s3Bucket,
          s3AccessKey: org.s3AccessKey,
          hasS3Secret: !!org.s3SecretKeyEnc,
          s3PublicUrl: org.s3PublicUrl,
        }}
      />
    </div>
  );
}
