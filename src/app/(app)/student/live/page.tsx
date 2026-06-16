import { Video } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDateTime, fromNow } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function courseIdsFor(userId: string, orgId: string) {
  const e = await db.enrollment.findMany({
    where: { userId, organizationId: orgId, status: "ACTIVE" },
    select: { courseId: true },
  });
  return e.map((x) => x.courseId);
}

export default async function StudentLivePage() {
  const user = await requireRole("STUDENT");
  const courseIds = await courseIdsFor(user.id, user.orgId);

  const twoHoursAgo = new Date();
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

  const [upcoming, past] = await Promise.all([
    db.liveClass.findMany({
      where: {
        courseId: { in: courseIds },
        status: { in: ["SCHEDULED", "LIVE"] },
        scheduledStart: { gte: twoHoursAgo },
      },
      orderBy: { scheduledStart: "asc" },
      include: { course: { select: { code: true } } },
    }),
    db.liveClass.findMany({
      where: { courseId: { in: courseIds }, status: "ENDED" },
      orderBy: { scheduledStart: "desc" },
      take: 10,
      include: { course: { select: { code: true } } },
    }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader title="Live classes" description="Join upcoming sessions and review past ones." />

      <Card>
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <EmptyState icon={Video} title="No upcoming classes" />
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{c.title}</p>
                      {c.status === "LIVE" && <Badge>Live</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.course.code} · {formatDateTime(c.scheduledStart)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{fromNow(c.scheduledStart)}</Badge>
                    {c.joinUrl && (
                      <Button size="sm" asChild>
                        <a href={c.joinUrl} target="_blank" rel="noreferrer">
                          Join
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past classes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {past.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.course.code} · {formatDateTime(c.scheduledStart)}
                    </p>
                  </div>
                  <Badge variant="outline">Ended</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
