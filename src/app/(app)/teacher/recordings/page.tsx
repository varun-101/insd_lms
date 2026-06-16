import { PlayCircle } from "lucide-react";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { RecordingsGrid } from "@/components/app/recordings-grid";

export default async function TeacherRecordingsPage() {
  const teacher = await requireRole("TEACHER");
  const recordings = await db.recording.findMany({
    where: {
      organizationId: teacher.orgId,
      course: { ownerTeacherId: teacher.id },
      status: "READY",
    },
    orderBy: { recordedAt: "desc" },
    include: { course: { select: { code: true, title: true } } },
  });

  return (
    <div className="space-y-7">
      <PageHeader
        title="Recordings"
        description="Recorded classes are saved here automatically."
      />
      {recordings.length === 0 ? (
        <EmptyState
          icon={PlayCircle}
          title="No recordings yet"
          description="After you host a recorded Zoom class, it will appear here."
        />
      ) : (
        <RecordingsGrid recordings={recordings} />
      )}
    </div>
  );
}
