import { Megaphone } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { fromNow } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentAnnouncementsPage() {
  const user = await requireRole("STUDENT");
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id, organizationId: user.orgId, status: "ACTIVE" },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const announcements = await db.announcement.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { code: true, title: true } },
      author: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Announcements"
        description="Updates from your teachers."
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description="When teachers post updates, they appear here."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-2 py-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{a.course.code}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {a.author.name} · {fromNow(a.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
