import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";

export type CohortWithCount = Awaited<ReturnType<typeof getCohort>>;

export async function getCohort(id: string) {
  return db.cohort.findUnique({
    where: { id },
    include: { course: true, _count: { select: { enrollments: true } } },
  });
}

export function seatsLeft(cohort: { capacity: number; _count: { enrollments: number } }) {
  if (cohort.capacity <= 0) return null; // unlimited
  return Math.max(0, cohort.capacity - cohort._count.enrollments);
}

/** A cohort the caller owns via the parent course, or throw. */
export async function requireOwnedCohort(userId: string, cohortId: string) {
  const cohort = await db.cohort.findFirst({
    where: { id: cohortId, course: { instructorId: userId } },
    include: { course: true, sessions: { orderBy: { startsAt: "asc" } }, _count: { select: { enrollments: true } } },
  });
  if (!cohort) throw new ApiError(404, "NOT_FOUND", "Class not found.");
  return cohort;
}

/**
 * Add a user to a cohort roster. Idempotent on (cohortId, userId). Enforces
 * capacity. Assumes the caller has already granted course access (paid or free).
 */
export async function enrollInCohort(cohortId: string, userId: string, enrollmentId?: string) {
  const existing = await db.cohortEnrollment.findUnique({
    where: { cohortId_userId: { cohortId, userId } },
  });
  if (existing) return existing;

  const cohort = await db.cohort.findUnique({
    where: { id: cohortId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!cohort) throw new ApiError(404, "NOT_FOUND", "Class not found.");
  if (cohort.capacity > 0 && cohort._count.enrollments >= cohort.capacity) {
    throw new ApiError(409, "COHORT_FULL", "This class is full.");
  }

  const row = await db.cohortEnrollment.create({
    data: { cohortId, userId, enrollmentId: enrollmentId ?? null },
  });
  await db.cohortWaitlist.deleteMany({ where: { cohortId, userId } });
  return row;
}

/**
 * Join a cohort without payment — for users who already own the course, or a
 * free course/cohort. Ensures a course Enrollment exists first.
 */
export async function joinFreeCohort(cohortId: string, userId: string) {
  const cohort = await db.cohort.findUnique({
    where: { id: cohortId },
    include: { course: true, _count: { select: { enrollments: true } } },
  });
  if (!cohort || cohort.status !== "OPEN") {
    throw new ApiError(404, "NOT_FOUND", "That class is not open for enrolment.");
  }
  if (cohort.enrollByDate && cohort.enrollByDate.getTime() < Date.now()) {
    throw new ApiError(409, "ENROLMENT_CLOSED", "Enrolment for this class has closed.");
  }

  const price = cohort.priceCents ?? cohort.course.priceCents;
  const owns = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: cohort.courseId } },
  });
  if (!owns && price > 0) {
    throw new ApiError(402, "PAYMENT_REQUIRED", "This class requires payment.");
  }

  const enrollment =
    owns ??
    (await db.enrollment.create({ data: { userId, courseId: cohort.courseId } }));

  return enrollInCohort(cohortId, userId, enrollment.id);
}

export async function listOpenCohorts(courseId: string) {
  const rows = await db.cohort.findMany({
    where: { courseId, status: "OPEN" },
    orderBy: { startDate: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });
  return rows.map((c) => ({ ...c, seatsLeft: seatsLeft(c) }));
}

// ---- Waitlist -------------------------------------------------------

export async function joinWaitlist(cohortId: string, userId: string) {
  const cohort = await db.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort || cohort.status !== "OPEN") throw new ApiError(404, "NOT_FOUND", "That class isn't open.");
  const already = await db.cohortEnrollment.findUnique({ where: { cohortId_userId: { cohortId, userId } } });
  if (already) throw new ApiError(409, "ALREADY_IN", "You're already enrolled in this class.");
  return db.cohortWaitlist.upsert({
    where: { cohortId_userId: { cohortId, userId } },
    create: { cohortId, userId },
    update: {},
  });
}

/** Email everyone on the waitlist that the class is open again. Instructor action. */
export async function notifyWaitlist(cohortId: string) {
  const { sendEmail, appUrl } = await import("@/lib/email");
  const cohort = await db.cohort.findUnique({ where: { id: cohortId }, include: { course: true } });
  if (!cohort) throw new ApiError(404, "NOT_FOUND", "Class not found.");

  const rows = await db.cohortWaitlist.findMany({
    where: { cohortId, notifiedAt: null },
    include: { user: { select: { email: true, name: true } } },
  });
  const url = appUrl(`/courses/${cohort.course.slug}`);
  for (const w of rows) {
    await db.notification.create({
      data: {
        userId: w.userId,
        type: "COURSE",
        title: `A seat opened up: ${cohort.title}`,
        body: `There's now space in "${cohort.title}" for ${cohort.course.title}. Join before it fills again.`,
        linkUrl: `/courses/${cohort.course.slug}`,
      },
    }).catch(() => {});
    await sendEmail({
      to: w.user.email,
      template: "course-enrollment",
      subject: `A seat opened up in ${cohort.title}`,
      data: { courseTitle: `${cohort.course.title} — ${cohort.title}`, link: url },
    }).catch(() => {});
  }
  await db.cohortWaitlist.updateMany({ where: { cohortId, notifiedAt: null }, data: { notifiedAt: new Date() } });
  return rows.length;
}

/** Drop a user from a cohort's waitlist (e.g. once they enrol). */
export async function leaveWaitlist(cohortId: string, userId: string) {
  await db.cohortWaitlist.deleteMany({ where: { cohortId, userId } });
}

// ---- Attendance ----------------------------------------------------

export async function markAttendance(sessionId: string, entries: { userId: string; present: boolean }[]) {
  await db.$transaction(
    entries.map((e) =>
      db.sessionAttendance.upsert({
        where: { sessionId_userId: { sessionId, userId: e.userId } },
        create: { sessionId, userId: e.userId, present: e.present },
        update: { present: e.present, markedAt: new Date() },
      }),
    ),
  );
}

/** Map of sessionId -> Set of present userIds, for one cohort. */
export async function attendanceByCohort(cohortId: string) {
  const rows = await db.sessionAttendance.findMany({
    where: { session: { cohortId }, present: true },
    select: { sessionId: true, userId: true },
  });
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!map.has(r.sessionId)) map.set(r.sessionId, new Set());
    map.get(r.sessionId)!.add(r.userId);
  }
  return map;
}
