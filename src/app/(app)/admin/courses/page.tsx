import { BookOpen } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCoursesPage() {
  const { orgId } = await requireRole("ADMIN");
  const courses = await db.course.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true } },
      _count: { select: { enrollments: true, liveClasses: true } },
    },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Courses"
        description="All courses across the institution."
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Teachers can create courses from their dashboard."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Classes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.owner.name}</TableCell>
                  <TableCell className="text-right">{c._count.enrollments}</TableCell>
                  <TableCell className="text-right">{c._count.liveClasses}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.status.toLowerCase()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
