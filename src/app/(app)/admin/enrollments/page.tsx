import { GraduationCap } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { EnrollDialog } from "@/components/forms/enroll-dialog";
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

export default async function AdminEnrollmentsPage() {
  const { orgId } = await requireRole("ADMIN");

  const [enrollments, students, courses] = await Promise.all([
    db.enrollment.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { code: true, title: true } },
      },
    }),
    db.membership.findMany({
      where: { orgId, role: "STUDENT" },
      select: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    db.course.findMany({
      where: { organizationId: orgId },
      select: { id: true, code: true, title: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Enrollments"
        description="Assign students to courses."
        action={
          <EnrollDialog
            students={students.map((s) => ({ id: s.user.id, label: `${s.user.name} (${s.user.email})` }))}
            courses={courses.map((c) => ({ id: c.id, label: `${c.code} · ${c.title}` }))}
          />
        }
      />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No enrollments yet"
          description="Enrol students into courses to get started."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <p className="font-medium">{e.user.name}</p>
                    <p className="text-xs text-muted-foreground">{e.user.email}</p>
                  </TableCell>
                  <TableCell>
                    {e.course.code} · {e.course.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e.status.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatDate(e.createdAt)}
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
