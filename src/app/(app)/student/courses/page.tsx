import { BookOpen, User } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentCoursesPage() {
  const user = await requireRole("STUDENT");
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id, organizationId: user.orgId, status: "ACTIVE" },
    include: {
      course: {
        include: { owner: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-7">
      <PageHeader title="My courses" description="Everything you're enrolled in." />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="When your administrator enrols you, your courses appear here."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(({ course: c }) => (
            <Card key={c.id} className="h-full gap-0 p-0">
              <div
                className="h-2 rounded-t-[calc(var(--radius)+2px)]"
                style={{ backgroundColor: c.coverColor ?? "#10b981" }}
              />
              <div className="space-y-3 p-5">
                <Badge variant="secondary">{c.code}</Badge>
                <h3 className="font-heading text-lg font-semibold">{c.title}</h3>
                {c.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                  <User className="size-3.5" /> {c.owner.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
