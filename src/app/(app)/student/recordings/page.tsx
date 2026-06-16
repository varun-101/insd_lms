import { PlayCircle } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { RecordingsGrid } from "@/components/app/recordings-grid";

export default async function StudentRecordingsPage() {
  const user = await requireRole("STUDENT");
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id, organizationId: user.orgId, status: "ACTIVE" },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const recordings = await db.recording.findMany({
    where: { courseId: { in: courseIds }, status: "READY" },
    orderBy: { recordedAt: "desc" },
    include: { course: { select: { code: true, title: true } } },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Recordings"
        description="Catch up on past classes anytime."
      />
      {recordings.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No recordings yet"
          description="Recorded classes from your courses will show up here."
        />
      ) : (
        <RecordingsGrid recordings={recordings} />
      )}
    </div>
  );
}
