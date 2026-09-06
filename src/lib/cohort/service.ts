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

  return db.cohortEnrollment.create({
    data: { cohortId, userId, enrollmentId: enrollmentId ?? null },
  });
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
