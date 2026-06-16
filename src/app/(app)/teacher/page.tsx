import Link from "next/link";
import { BookOpen, Users, Video, PlayCircle, Plus } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDateTime, fromNow } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function TeacherDashboard() {
  const user = await requireRole("TEACHER");

  const courses = await db.course.findMany({
    where: { ownerTeacherId: user.id, organizationId: user.orgId },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);

  const [studentsCount, upcoming, recordingsCount] = await Promise.all([
    db.enrollment.count({
      where: { courseId: { in: courseIds }, status: "ACTIVE" },
    }),
    db.liveClass.findMany({
      where: {
        courseId: { in: courseIds },
        status: "SCHEDULED",
        scheduledStart: { gte: new Date() },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
      include: { course: { select: { code: true } } },
    }),
    db.recording.count({ where: { courseId: { in: courseIds } } }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Welcome, ${user.name?.split(" ")[0] ?? "Teacher"}`}
        description="Manage your courses and classes."
        action={
          <Button asChild>
            <Link href="/teacher/live">
              <Plus className="size-4" /> Schedule class
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My courses" value={courses.length} icon={BookOpen} />
        <StatCard label="Students" value={studentsCount} icon={Users} />
        <StatCard label="Upcoming classes" value={upcoming.length} icon={Video} />
        <StatCard label="Recordings" value={recordingsCount} icon={PlayCircle} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Upcoming live classes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teacher/live">Manage</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-brand">
                <Video className="size-5" />
              </span>
              <p className="text-sm text-muted-foreground">
                No upcoming classes. Schedule your next one.
              </p>
              <Button size="sm" className="mt-1" asChild>
                <Link href="/teacher/live">
                  <Plus className="size-4" /> Schedule a class
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((c) => (
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
                  <Badge variant="secondary">{fromNow(c.scheduledStart)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
