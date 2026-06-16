import { Video, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { ScheduleClassDialog } from "@/components/forms/schedule-class-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusVariant: Record<string, "secondary" | "outline" | "default"> = {
  SCHEDULED: "secondary",
  LIVE: "default",
  ENDED: "outline",
  CANCELLED: "outline",
};

export default async function TeacherLivePage() {
  const teacher = await requireRole("TEACHER");

  const [courses, classes] = await Promise.all([
    db.course.findMany({
      where: { ownerTeacherId: teacher.id, organizationId: teacher.orgId },
      select: { id: true, code: true, title: true },
      orderBy: { code: "asc" },
    }),
    db.liveClass.findMany({
      where: { hostUserId: teacher.id, organizationId: teacher.orgId },
      orderBy: { scheduledStart: "desc" },
      include: { course: { select: { code: true } } },
    }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Live classes"
        description="Schedule Zoom sessions; recordings and attendance sync automatically."
        action={<ScheduleClassDialog courses={courses} />}
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No classes scheduled"
          description={
            courses.length === 0
              ? "Create a course first, then schedule a class."
              : "Schedule your first live class."
          }
          action={courses.length > 0 ? <ScheduleClassDialog courses={courses} /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {classes.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{c.title}</p>
                      <Badge variant={statusVariant[c.status]}>
                        {c.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.course.code} · {formatDateTime(c.scheduledStart)} ·{" "}
                      {c.durationMins} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.startUrl && c.status !== "ENDED" && c.status !== "CANCELLED" && (
                      <Button size="sm" asChild>
                        <a href={c.startUrl} target="_blank" rel="noreferrer">
                          Start <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    )}
                    {!c.zoomMeetingId && (
                      <Badge variant="outline">No Zoom link</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
