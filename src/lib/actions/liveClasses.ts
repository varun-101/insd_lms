"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { createMeeting, zoomCredsForOrg } from "@/lib/zoom";

export type ActionState = { ok?: boolean; error?: string };

const scheduleSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  title: z.string().min(2, "Title is required"),
  scheduledStart: z.coerce.date(),
  durationMins: z.coerce.number().int().min(5).max(600),
});

export async function scheduleLiveClass(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { id: teacherId, orgId } = await requireRole("TEACHER");

  const parsed = scheduleSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    scheduledStart: formData.get("scheduledStart"),
    durationMins: formData.get("durationMins"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { courseId, title, scheduledStart, durationMins } = parsed.data;

  // Ownership check (course must belong to this teacher in this org).
  const course = await db.course.findFirst({
    where: { id: courseId, organizationId: orgId, ownerTeacherId: teacherId },
    select: { id: true },
  });
  if (!course) return { error: "Course not found." };

  // Create the Zoom meeting if the org has Zoom configured; otherwise create a
  // placeholder class so the app remains usable without Zoom credentials.
  let zoom: {
    zoomMeetingId?: string;
    joinUrl?: string;
    startUrl?: string;
    passcode?: string;
  } = {};

  const org = await db.organization.findUnique({ where: { id: orgId } });
  const creds = org ? zoomCredsForOrg(org) : null;

  if (creds) {
    const membership = await db.membership.findUnique({
      where: { userId_orgId: { userId: teacherId, orgId } },
      select: { zoomUserId: true, user: { select: { email: true } } },
    });
    const hostId = membership?.zoomUserId || membership?.user.email;
    if (!hostId) return { error: "No Zoom host is configured for your account in this organization." };

    try {
      const meeting = await createMeeting(creds, hostId, {
        topic: title,
        startTime: scheduledStart,
        durationMins,
      });
      zoom = {
        zoomMeetingId: meeting.id.toString(),
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        passcode: meeting.password,
      };
    } catch (e) {
      return { error: `Could not create Zoom meeting: ${(e as Error).message}` };
    }
  }

  await db.liveClass.create({
    data: {
      courseId,
      organizationId: orgId,
      title,
      scheduledStart,
      durationMins,
      hostUserId: teacherId,
      status: "SCHEDULED",
      ...zoom,
    },
  });

  // Notify enrolled students.
  const enrollments = await db.enrollment.findMany({
    where: { courseId, status: "ACTIVE" },
    select: { userId: true },
  });
  if (enrollments.length) {
    await db.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.userId,
        organizationId: orgId,
        type: "LIVE_CLASS_SCHEDULED" as const,
        title: "New live class scheduled",
        body: `"${title}" has been scheduled.`,
        href: "/student/live",
      })),
    });
  }

  revalidatePath("/teacher/live");
  return { ok: true };
}

export async function cancelLiveClass(id: string): Promise<ActionState> {
  const { id: teacherId, orgId } = await requireRole("TEACHER");
  const liveClass = await db.liveClass.findFirst({
    where: { id, organizationId: orgId, hostUserId: teacherId },
    select: { id: true },
  });
  if (!liveClass) return { error: "Class not found." };

  await db.liveClass.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/teacher/live");
  return { ok: true };
}
