"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma, type OrgStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session";
import { encryptOptional } from "@/lib/crypto";

export type ActionState = { ok?: boolean; error?: string };

const slugSchema = z
  .string()
  .min(2, "Slug is too short")
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only");

const createOrgSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  slug: slugSchema,
});

/** Create a new organization (tenant). */
export async function createOrganization(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePlatformAdmin();

  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db.organization.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "An organization with that slug already exists." };
    }
    throw e;
  }

  revalidatePath("/platform");
  return { ok: true };
}

const integrationsSchema = z.object({
  orgId: z.string().min(1),
  // Zoom
  zoomAccountId: z.string().optional(),
  zoomClientId: z.string().optional(),
  zoomClientSecret: z.string().optional(),
  zoomWebhookSecret: z.string().optional(),
  // S3
  s3Endpoint: z.string().optional(),
  s3Region: z.string().optional(),
  s3Bucket: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  s3PublicUrl: z.string().optional(),
});

const blankToUndefined = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

/**
 * Update an org's Zoom + S3 configuration. Secret fields are encrypted; an empty
 * secret field leaves the previously stored secret untouched.
 */
export async function updateOrgIntegrations(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePlatformAdmin();

  const parsed = integrationsSchema.safeParse({
    orgId: formData.get("orgId"),
    zoomAccountId: blankToUndefined(formData.get("zoomAccountId")),
    zoomClientId: blankToUndefined(formData.get("zoomClientId")),
    zoomClientSecret: blankToUndefined(formData.get("zoomClientSecret")),
    zoomWebhookSecret: blankToUndefined(formData.get("zoomWebhookSecret")),
    s3Endpoint: blankToUndefined(formData.get("s3Endpoint")),
    s3Region: blankToUndefined(formData.get("s3Region")),
    s3Bucket: blankToUndefined(formData.get("s3Bucket")),
    s3AccessKey: blankToUndefined(formData.get("s3AccessKey")),
    s3SecretKey: blankToUndefined(formData.get("s3SecretKey")),
    s3PublicUrl: blankToUndefined(formData.get("s3PublicUrl")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  await db.organization.update({
    where: { id: d.orgId },
    data: {
      zoomAccountId: d.zoomAccountId ?? null,
      zoomClientId: d.zoomClientId ?? null,
      // Only overwrite secrets when a new value is supplied.
      ...(d.zoomClientSecret ? { zoomClientSecretEnc: encryptOptional(d.zoomClientSecret) } : {}),
      ...(d.zoomWebhookSecret ? { zoomWebhookSecretEnc: encryptOptional(d.zoomWebhookSecret) } : {}),
      s3Endpoint: d.s3Endpoint ?? null,
      s3Region: d.s3Region ?? null,
      s3Bucket: d.s3Bucket ?? null,
      s3AccessKey: d.s3AccessKey ?? null,
      s3PublicUrl: d.s3PublicUrl ?? null,
      ...(d.s3SecretKey ? { s3SecretKeyEnc: encryptOptional(d.s3SecretKey) } : {}),
    },
  });

  revalidatePath(`/platform/${d.orgId}`);
  return { ok: true };
}

const inviteAdminSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** Add (or reuse) a user and grant them ADMIN membership in the given org. */
export async function inviteOrgAdmin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requirePlatformAdmin();

  const parsed = inviteAdminSchema.safeParse({
    orgId: formData.get("orgId"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { orgId, name, email, password } = parsed.data;
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
        data: { userId, orgId, role: "ADMIN" },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "This user is already a member of the organization." };
    }
    throw e;
  }

  revalidatePath(`/platform/${orgId}`);
  return { ok: true };
}

/** Suspend or re-activate an organization. */
export async function setOrgStatus(orgId: string, status: OrgStatus): Promise<void> {
  await requirePlatformAdmin();
  await db.organization.update({ where: { id: orgId }, data: { status } });
  revalidatePath("/platform");
  revalidatePath(`/platform/${orgId}`);
}
