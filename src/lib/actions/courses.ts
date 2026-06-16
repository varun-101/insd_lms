"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type ActionState = { ok?: boolean; error?: string };

const courseSchema = z.object({
  code: z.string().min(2, "Course code is required"),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  term: z.string().optional(),
});

export async function createCourse(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { id, orgId } = await requireRole("TEACHER");

  const parsed = courseSchema.safeParse({
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    term: formData.get("term") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db.course.create({
      data: {
        ...parsed.data,
        code: parsed.data.code.toUpperCase(),
        organizationId: orgId,
        ownerTeacherId: id,
        status: "PUBLISHED",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "A course with that code already exists." };
    }
    throw e;
  }

  revalidatePath("/teacher/courses");
  return { ok: true };
}

const enrollSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
});

export async function enrollStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireRole("ADMIN");
  const parsed = enrollSchema.safeParse({
    courseId: formData.get("courseId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) return { error: "Invalid input" };
  const { courseId, userId } = parsed.data;

  // Both the course and the student must belong to the admin's org.
  const [course, membership] = await Promise.all([
    db.course.findFirst({ where: { id: courseId, organizationId: orgId }, select: { id: true } }),
    db.membership.findFirst({ where: { userId, orgId }, select: { id: true } }),
  ]);
  if (!course) return { error: "Course not found." };
  if (!membership) return { error: "Student is not a member of this organization." };

  try {
    await db.enrollment.create({
      data: { courseId, userId, organizationId: orgId, status: "ACTIVE" },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Student is already enrolled in this course." };
    }
    throw e;
  }

  revalidatePath("/admin/enrollments");
  return { ok: true };
}
