import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Platform operator (no org membership).
  await db.user.upsert({
    where: { email: "super@verdant.app" },
    update: { platformRole: "SUPER_ADMIN" },
    create: {
      name: "Platform Operator",
      email: "super@verdant.app",
      passwordHash,
      platformRole: "SUPER_ADMIN",
    },
  });

  // Demo organization (tenant).
  const org = await db.organization.upsert({
    where: { slug: "verdant-demo" },
    update: {},
    create: { name: "Verdant Demo College", slug: "verdant-demo" },
  });

  // Helper: create-or-reuse a global user, then ensure a membership in the org.
  async function member(
    email: string,
    name: string,
    role: "ADMIN" | "TEACHER" | "STUDENT",
    zoomUserId?: string,
  ) {
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash },
    });
    await db.membership.upsert({
      where: { userId_orgId: { userId: user.id, orgId: org.id } },
      update: { role, zoomUserId: zoomUserId ?? null },
      create: { userId: user.id, orgId: org.id, role, zoomUserId: zoomUserId ?? null },
    });
    return user;
  }

  await member("admin@verdant.edu", "Aditi Rao", "ADMIN");
  const teacher = await member(
    "teacher@verdant.edu",
    "Rajesh Kumar",
    "TEACHER",
    "teacher@verdant.edu",
  );
  const students = await Promise.all([
    member("sneha@verdant.edu", "Sneha Patel", "STUDENT"),
    member("arjun@verdant.edu", "Arjun Mehta", "STUDENT"),
    member("priya@verdant.edu", "Priya Nair", "STUDENT"),
  ]);

  const course = await db.course.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "CS201" } },
    update: {},
    create: {
      organizationId: org.id,
      code: "CS201",
      title: "Data Structures & Algorithms",
      description:
        "Core data structures, complexity analysis, and algorithm design techniques.",
      term: "Autumn 2026",
      status: "PUBLISHED",
      coverColor: "#10b981",
      ownerTeacherId: teacher.id,
      modules: {
        create: [
          {
            title: "Foundations",
            position: 0,
            lessons: {
              create: [
                { title: "Course intro", type: "TEXT", position: 0, body: "Welcome!" },
                { title: "Big-O notation", type: "LINK", position: 1, url: "https://example.com" },
              ],
            },
          },
          {
            title: "Linear structures",
            position: 1,
            lessons: {
              create: [
                { title: "Arrays & lists", type: "TEXT", position: 0, body: "..." },
                { title: "Stacks & queues", type: "TEXT", position: 1, body: "..." },
              ],
            },
          },
        ],
      },
    },
  });

  await Promise.all(
    students.map((s) =>
      db.enrollment.upsert({
        where: { userId_courseId: { userId: s.id, courseId: course.id } },
        update: {},
        create: {
          userId: s.id,
          courseId: course.id,
          organizationId: org.id,
          status: "ACTIVE",
        },
      }),
    ),
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const existingClass = await db.liveClass.findFirst({
    where: { courseId: course.id, title: "Recursion deep-dive" },
  });
  if (!existingClass) {
    await db.liveClass.create({
      data: {
        courseId: course.id,
        organizationId: org.id,
        title: "Recursion deep-dive",
        scheduledStart: tomorrow,
        durationMins: 60,
        hostUserId: teacher.id,
        status: "SCHEDULED",
      },
    });
  }

  const existingAnnouncement = await db.announcement.findFirst({
    where: { courseId: course.id },
  });
  if (!existingAnnouncement) {
    await db.announcement.create({
      data: {
        courseId: course.id,
        organizationId: org.id,
        authorId: teacher.id,
        body: "Welcome to CS201! Our first live class is scheduled for tomorrow at 10 AM.",
      },
    });
  }

  console.log("✅ Seed complete");
  console.log("   Super admin: super@verdant.app  → /platform");
  console.log("   Org admin:   admin@verdant.edu");
  console.log("   Teacher:     teacher@verdant.edu");
  console.log("   Student:     sneha@verdant.edu");
  console.log(`   Password (all): ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
