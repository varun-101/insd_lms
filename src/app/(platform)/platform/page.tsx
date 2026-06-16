import Link from "next/link";
import { Building2, Users, BookOpen, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session";
import { zoomCredsForOrg } from "@/lib/zoom";
import { storageConfigured } from "@/lib/storage";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateOrgDialog } from "@/components/platform/create-org-dialog";

export default async function PlatformHome() {
  await requirePlatformAdmin();

  const orgs = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, courses: true } },
    },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Organizations"
        description="Provision and configure tenant organizations."
        action={<CreateOrgDialog />}
      />

      {orgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create your first organization to get started."
          action={<CreateOrgDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {orgs.map((o) => {
            const zoomOk = !!zoomCredsForOrg(o);
            const s3Ok = storageConfigured(o);
            return (
              <Link key={o.id} href={`/platform/${o.id}`}>
                <Card className="h-full p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-lg font-semibold">
                        {o.name}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">/{o.slug}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant={o.status === "ACTIVE" ? "secondary" : "outline"}>
                      {o.status.toLowerCase()}
                    </Badge>
                    <Badge variant={zoomOk ? "secondary" : "outline"}>
                      Zoom {zoomOk ? "✓" : "—"}
                    </Badge>
                    <Badge variant={s3Ok ? "secondary" : "outline"}>
                      S3 {s3Ok ? "✓" : "—"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" /> {o._count.memberships} members
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5" /> {o._count.courses} courses
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
