import { CalendarCheck } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeacherAttendancePage() {
  const teacher = await requireRole("TEACHER");

  const classes = await db.liveClass.findMany({
    where: { hostUserId: teacher.id, organizationId: teacher.orgId, status: "ENDED" },
    orderBy: { scheduledStart: "desc" },
    include: {
      course: { select: { code: true } },
      attendance: { select: { status: true } },
    },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Attendance"
        description="Captured automatically from Zoom join/leave times."
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No completed classes yet"
          description="Once a live class ends, attendance is reconciled and shown here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/60">
              {classes.map((c) => {
                const present = c.attendance.filter((a) => a.status === "PRESENT").length;
                const partial = c.attendance.filter((a) => a.status === "PARTIAL").length;
                const absent = c.attendance.filter((a) => a.status === "ABSENT").length;
                return (
                  <li
                    key={c.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.course.code} · {formatDateTime(c.scheduledStart)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{present} present</Badge>
                      <Badge variant="outline">{partial} partial</Badge>
                      <Badge variant="outline">{absent} absent</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
