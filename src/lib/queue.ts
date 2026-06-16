import { Queue } from "bullmq";
import { connection } from "@/lib/redis";

export const QUEUES = {
  recordings: "recordings",
  attendance: "attendance",
  email: "email",
} as const;

// ---- Job payload types (shared between producers and the worker) ----

export type RecordingJob = {
  type: "download";
  orgId: string; // tenant whose Zoom/S3 credentials to use
  meetingId: string; // Zoom meeting id (numeric, as string)
};

export type AttendanceJob =
  | { type: "participant"; orgId: string; meetingId: string; email?: string; name?: string; action: "join" | "leave"; time: string }
  | { type: "finalize"; orgId: string; meetingId: string };

export type EmailJob = {
  to: string;
  subject: string;
  html: string;
};

const opts = {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
};

// Lazily instantiated so importing this module (e.g. during `next build`)
// does not open a Redis connection. Queues connect on first use at runtime.
let _recordings: Queue<RecordingJob> | undefined;
let _attendance: Queue<AttendanceJob> | undefined;
let _email: Queue<EmailJob> | undefined;

export const recordingsQueue = () =>
  (_recordings ??= new Queue<RecordingJob>(QUEUES.recordings, opts));
export const attendanceQueue = () =>
  (_attendance ??= new Queue<AttendanceJob>(QUEUES.attendance, opts));
export const emailQueue = () =>
  (_email ??= new Queue<EmailJob>(QUEUES.email, opts));
