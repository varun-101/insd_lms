import "dotenv/config";
import { Worker } from "bullmq";
import { Readable } from "node:stream";

import { connection } from "@/lib/redis";
import { db } from "@/lib/db";
import { QUEUES, type RecordingJob, type AttendanceJob, type EmailJob } from "@/lib/queue";
import {
  getMeetingRecordings,
  trashMeetingRecordings,
  fetchRecordingStream,
  getPastMeetingParticipants,
  zoomCredsForOrg,
} from "@/lib/zoom";
import { storageFor } from "@/lib/storage";
import { sendMail } from "@/lib/email";

const log = (...a: unknown[]) => console.log("[worker]", ...a);

// ---------- Recordings: download from Zoom → object storage ----------

const recordingsWorker = new Worker<RecordingJob>(
  QUEUES.recordings,
  async (job) => {
    const { orgId, meetingId } = job.data;

    const org = await db.organization.findUnique({ where: { id: orgId } });
    const creds = org ? zoomCredsForOrg(org) : null;
    const storage = org ? storageFor(org) : null;
    if (!org || !creds || !storage) {
      log(`Org ${orgId} not fully configured (Zoom/S3); skipping recording.`);
      return;
    }

    const liveClass = await db.liveClass.findFirst({
      where: { organizationId: orgId, zoomMeetingId: meetingId },
    });
    if (!liveClass) {
      log(`No LiveClass for meeting ${meetingId} in org ${orgId}; skipping recording.`);
      return;
    }

    const data = await getMeetingRecordings(creds, meetingId);
    const mp4 =
      data.recording_files.find(
        (f) => f.file_type === "MP4" && f.recording_type === "shared_screen_with_speaker_view",
      ) ?? data.recording_files.find((f) => f.file_type === "MP4");

    if (!mp4) {
      log(`No MP4 recording for meeting ${meetingId}.`);
      return;
    }

    const key = storage.key(`recordings/${liveClass.courseId}/${meetingId}-${mp4.id}.mp4`);

    const existing = await db.recording.findFirst({ where: { fileKey: key } });
    if (existing?.status === "READY") {
      log(`Recording already stored for meeting ${meetingId}.`);
      return;
    }

    log(`Downloading recording for meeting ${meetingId} (${mp4.file_size} bytes)…`);
    const res = await fetchRecordingStream(creds, mp4.download_url);
    const nodeStream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);
    await storage.putObject(key, nodeStream, "video/mp4", mp4.file_size);

    await db.recording.create({
      data: {
        organizationId: orgId,
        courseId: liveClass.courseId,
        liveClassId: liveClass.id,
        title: liveClass.title,
        status: "READY",
        fileKey: key,
        playUrl: storage.publicUrl(key),
        durationMins: data.duration,
        sizeBytes: BigInt(mp4.file_size),
        recordedAt: new Date(mp4.recording_start),
      },
    });

    // Free Zoom cloud storage now that we have our own copy.
    await trashMeetingRecordings(creds, meetingId).catch((e) =>
      log(`Could not trash Zoom recording ${meetingId}: ${e}`),
    );

    // Notify enrolled students.
    const enrollments = await db.enrollment.findMany({
      where: { courseId: liveClass.courseId, status: "ACTIVE" },
      select: { userId: true },
    });
    if (enrollments.length) {
      await db.notification.createMany({
        data: enrollments.map((e) => ({
          userId: e.userId,
          organizationId: orgId,
          type: "RECORDING_READY" as const,
          title: "New recording available",
          body: `"${liveClass.title}" is ready to watch.`,
          href: "/student/recordings",
        })),
      });
    }

    log(`Recording stored for meeting ${meetingId}.`);
  },
  { connection, concurrency: 2 },
);

// ---------- Attendance: reconcile from Zoom report ----------

const attendanceWorker = new Worker<AttendanceJob>(
  QUEUES.attendance,
  async (job) => {
    if (job.data.type !== "finalize") return;
    const { orgId, meetingId } = job.data;

    const org = await db.organization.findUnique({ where: { id: orgId } });
    const creds = org ? zoomCredsForOrg(org) : null;
    if (!creds) {
      log(`Org ${orgId} has no Zoom credentials; skipping attendance.`);
      return;
    }

    const liveClass = await db.liveClass.findFirst({
      where: { organizationId: orgId, zoomMeetingId: meetingId },
    });
    if (!liveClass) return;

    const participants = await getPastMeetingParticipants(creds, meetingId);

    // Aggregate sessions per email.
    const byEmail = new Map<
      string,
      { join: Date; leave: Date; seconds: number }
    >();
    for (const p of participants) {
      const email = p.user_email?.toLowerCase();
      if (!email) continue;
      const join = new Date(p.join_time);
      const leave = new Date(p.leave_time);
      const prev = byEmail.get(email);
      if (prev) {
        prev.seconds += p.duration;
        if (join < prev.join) prev.join = join;
        if (leave > prev.leave) prev.leave = leave;
      } else {
        byEmail.set(email, { join, leave, seconds: p.duration });
      }
    }

    const enrollments = await db.enrollment.findMany({
      where: { courseId: liveClass.courseId, status: "ACTIVE" },
      select: { user: { select: { id: true, email: true } } },
    });

    const classSeconds = liveClass.durationMins * 60;
    for (const { user } of enrollments) {
      const rec = byEmail.get(user.email.toLowerCase());
      const minutes = rec ? Math.round(rec.seconds / 60) : 0;
      const status = !rec
        ? "ABSENT"
        : rec.seconds >= classSeconds * 0.6
          ? "PRESENT"
          : "PARTIAL";

      await db.attendance.upsert({
        where: { liveClassId_userId: { liveClassId: liveClass.id, userId: user.id } },
        update: {
          joinTime: rec?.join ?? null,
          leaveTime: rec?.leave ?? null,
          durationMins: minutes,
          status,
        },
        create: {
          liveClassId: liveClass.id,
          userId: user.id,
          joinTime: rec?.join ?? null,
          leaveTime: rec?.leave ?? null,
          durationMins: minutes,
          status,
        },
      });
    }

    log(`Attendance finalized for meeting ${meetingId} (${enrollments.length} students).`);
  },
  { connection, concurrency: 2 },
);

// ---------- Email ----------

const emailWorker = new Worker<EmailJob>(
  QUEUES.email,
  async (job) => {
    await sendMail(job.data);
  },
  { connection, concurrency: 5 },
);

for (const w of [recordingsWorker, attendanceWorker, emailWorker]) {
  w.on("failed", (job, err) => log(`Job ${job?.id} failed:`, err.message));
}

log("Verdant worker started. Listening for jobs…");
