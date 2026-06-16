"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type ActionState = { ok?: boolean; error?: string };

const createUserSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  zoomUserId: z.string().optional(),
});

/**
 * Add a user to the admin's active organization. Users are global (one record
 * per email); this creates the `User` if new, then attaches a `Membership`
 * scoped to the org. If the person already exists (e.g. a member of another
 * org), their account is reused and the supplied password is ignored.
 */
export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId } = await requireRole("ADMIN");

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    zoomUserId: formData.get("zoomUserId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, role, password, zoomUserId } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      const userId =
        existing?.id ??
        (
          await tx.user.create({
            data: {
              name,
              email: normalizedEmail,
              passwordHash: await bcrypt.hash(password, 10),
            },
            select: { id: true },
          })
        ).id;

      await tx.membership.create({
        data: {
          userId,
          orgId,
          role,
          zoomUserId: role === "TEACHER" ? zoomUserId : null,
        },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "This user is already a member of your organization." };
    }
    throw e;
  }

  revalidatePath("/admin/users");
  return { ok: true };
}

const updateMembershipSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  zoomUserId: z.string().optional(),
});

/** Update a member's role, status, and (for teachers) Zoom host within the org. */
export async function updateMembership(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { orgId, id: adminUserId } = await requireRole("ADMIN");

  const parsed = updateMembershipSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
    status: formData.get("status"),
    zoomUserId: formData.get("zoomUserId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { membershipId, role, status, zoomUserId } = parsed.data;

  const membership = await db.membership.findFirst({
    where: { id: membershipId, orgId },
    select: { id: true, userId: true },
  });
  if (!membership) return { error: "Member not found." };

  // Don't let an admin lock themselves out of their own org.
  if (membership.userId === adminUserId && (role !== "ADMIN" || status !== "ACTIVE")) {
    return { error: "You can't change your own role or status." };
  }

  await db.membership.update({
    where: { id: membershipId },
    data: {
      role,
      status,
      zoomUserId: role === "TEACHER" ? zoomUserId ?? null : null,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

/** Remove a member from the org (deletes the membership, not the global user). */
export async function removeMembership(membershipId: string): Promise<ActionState> {
  const { orgId, id: adminUserId } = await requireRole("ADMIN");

  const membership = await db.membership.findFirst({
    where: { id: membershipId, orgId },
    select: { id: true, userId: true },
  });
  if (!membership) return { error: "Member not found." };
  if (membership.userId === adminUserId) {
    return { error: "You can't remove yourself from the organization." };
  }

  await db.membership.delete({ where: { id: membershipId } });
  revalidatePath("/admin/users");
  return { ok: true };
}
