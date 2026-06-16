import Link from "next/link";
import { Users, GraduationCap, BookOpen, Video, UserPlus } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { fromNow } from "@/lib/format";
import { roleLabel } from "@/lib/nav";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const { orgId } = await requireRole("ADMIN");

  const [teachers, students, courses, upcomingClasses, recentUsers] =
    await Promise.all([
      db.membership.count({ where: { orgId, role: "TEACHER" } }),
      db.membership.count({ where: { orgId, role: "STUDENT" } }),
      db.course.count({ where: { organizationId: orgId } }),
      db.liveClass.count({
        where: {
          organizationId: orgId,
          status: "SCHEDULED",
          scheduledStart: { gte: new Date() },
        },
      }),
      db.membership.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Admin overview"
        description="Manage people, courses and the platform."
        action={
          <Button asChild>
            <Link href="/admin/users">
              <UserPlus className="size-4" /> Add user
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Teachers" value={teachers} icon={Users} />
        <StatCard label="Students" value={students} icon={GraduationCap} />
        <StatCard label="Courses" value={courses} icon={BookOpen} />
        <StatCard label="Upcoming classes" value={upcomingClasses} icon={Video} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent users</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">Manage users</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No users yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recentUsers.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{roleLabel[m.role]}</Badge>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {fromNow(m.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
