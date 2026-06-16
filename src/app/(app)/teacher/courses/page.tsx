import Link from "next/link";
import { BookOpen, Users, Video } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { CreateCourseDialog } from "@/components/forms/create-course-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeacherCoursesPage() {
  const teacher = await requireRole("TEACHER");
  const courses = await db.course.findMany({
    where: { ownerTeacherId: teacher.id, organizationId: teacher.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true, liveClasses: true } },
    },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Courses"
        description="Create and manage the courses you teach."
        action={<CreateCourseDialog />}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start adding content and classes."
          action={<CreateCourseDialog />}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/teacher/courses/${c.id}`}>
              <Card className="h-full gap-0 p-0 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <div
                  className="h-2 rounded-t-[calc(var(--radius)+2px)]"
                  style={{ backgroundColor: c.coverColor ?? "#10b981" }}
                />
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{c.code}</Badge>
                    <Badge variant="outline">{c.status.toLowerCase()}</Badge>
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{c.title}</h3>
                  {c.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                  <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" /> {c._count.enrollments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Video className="size-3.5" /> {c._count.liveClasses}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
