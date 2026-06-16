import { CheckCircle2, XCircle, Video, Mail, HardDrive, Database } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { zoomCredsForOrg } from "@/lib/zoom";
import { storageConfigured } from "@/lib/storage";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function envConfigured(...keys: string[]) {
  return keys.every((k) => !!process.env[k]);
}

export default async function AdminSettingsPage() {
  const { orgId } = await requireRole("ADMIN");

  const org = await db.organization.findUnique({ where: { id: orgId } });

  const items: Array<{
    icon: LucideIcon;
    title: string;
    desc: string;
    ok: boolean;
    scope: "Organization" | "Platform";
  }> = [
    {
      icon: Video,
      title: "Zoom (live classes)",
      desc: "Server-to-Server OAuth for scheduling, recordings and attendance.",
      ok: !!org && !!zoomCredsForOrg(org),
      scope: "Organization",
    },
    {
      icon: HardDrive,
      title: "Object storage (S3)",
      desc: "Stores uploads and recorded classes.",
      ok: !!org && storageConfigured(org),
      scope: "Organization",
    },
    {
      icon: Database,
      title: "Redis (queues)",
      desc: "Background jobs for recordings and attendance.",
      ok: envConfigured("REDIS_URL"),
      scope: "Platform",
    },
    {
      icon: Mail,
      title: "Email (SMTP)",
      desc: "Transactional notifications and announcements.",
      ok: envConfigured("SMTP_HOST"),
      scope: "Platform",
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Settings"
        description="Integration status for your organization."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <Card key={it.title}>
            <CardHeader className="flex-row items-start gap-3 space-y-0">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-brand">
                <it.icon className="size-5" />
              </span>
              <div className="flex-1">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  {it.title}
                  {it.ok ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand">
                      <CheckCircle2 className="size-4" /> Configured
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <XCircle className="size-4" /> Not set
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {it.desc} <span className="text-xs">· Managed by {it.scope.toLowerCase()}</span>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-1 text-sm text-muted-foreground">
          Zoom and storage credentials for your organization are provisioned by
          the platform operator. Contact your Verdant platform administrator to
          update them.
        </CardContent>
      </Card>
    </div>
  );
}
