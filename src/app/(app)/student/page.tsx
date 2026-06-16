import Link from "next/link";
import { BookOpen, Video, PlayCircle, CalendarCheck, Megaphone } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDateTime, fromNow } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");

  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id, organizationId: user.orgId, status: "ACTIVE" },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const [upcoming, recordingsCount, attendance, announcements] = await Promise.all([
    db.liveClass.findMany({
      where: {
        courseId: { in: courseIds },
        status: "SCHEDULED",
        scheduledStart: { gte: new Date() },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
      include: { course: { select: { title: true, code: true } } },
    }),
    db.recording.count({
      where: { courseId: { in: courseIds }, status: "READY" },
    }),
    db.attendance.findMany({
      where: { userId: user.id, liveClass: { organizationId: user.orgId } },
      select: { status: true },
    }),
    db.announcement.findMany({
      where: { courseId: { in: courseIds } },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        course: { select: { title: true } },
        author: { select: { name: true } },
      },
    }),
  ]);

  const present = attendance.filter((a) => a.status !== "ABSENT").length;
  const attendancePct =
    attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Hello, ${user.name?.split(" ")[0] ?? "there"} 👋`}
        description="Here's what's happening in your courses."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enrolled courses" value={courseIds.length} icon={BookOpen} />
        <StatCard label="Upcoming classes" value={upcoming.length} icon={Video} />
        <StatCard label="Recordings" value={recordingsCount} icon={PlayCircle} />
        <StatCard
          label="Attendance"
          value={attendancePct === null ? "—" : `${attendancePct}%`}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming live classes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/live">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Video className="size-5" />}
                text="No classes scheduled. Enjoy the break!"
              />
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

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <EmptyState
                icon={<Megaphone className="size-5" />}
                text="Nothing new right now."
              />
            ) : (
              <ul className="space-y-4">
                {announcements.map((a) => (
                  <li key={a.id} className="space-y-1">
                    <p className="line-clamp-2 text-sm">{a.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.course.title} · {fromNow(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-brand">
        {icon}
      </span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
