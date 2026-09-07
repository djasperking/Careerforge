import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";

export type RatingSummary = {
  count: number;
  average: number; // 0 when no reviews
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

/** Visible-review rating summary for one course. */
export async function courseRatingSummary(courseId: string): Promise<RatingSummary> {
  const rows = await db.review.findMany({
    where: { courseId, status: "VISIBLE" },
    select: { rating: true },
  });
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingSummary["distribution"];
  let total = 0;
  for (const r of rows) {
    const k = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[k] += 1;
    total += k;
  }
  return {
    count: rows.length,
    average: rows.length ? Math.round((total / rows.length) * 10) / 10 : 0,
    distribution,
  };
}

/** Rating summaries for many courses at once (for catalogue cards). */
export async function ratingSummaries(courseIds: string[]): Promise<Map<string, { average: number; count: number }>> {
  if (courseIds.length === 0) return new Map();
  const grouped = await db.review.groupBy({
    by: ["courseId"],
    where: { courseId: { in: courseIds }, status: "VISIBLE" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(
    grouped.map((g) => [
      g.courseId,
      { average: Math.round((g._avg.rating ?? 0) * 10) / 10, count: g._count._all },
    ]),
  );
}

export async function listCourseReviews(courseId: string, take = 30) {
  return db.review.findMany({
    where: { courseId, status: "VISIBLE" },
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { name: true } } },
  });
}

export async function getUserReview(userId: string, courseId: string) {
  return db.review.findUnique({ where: { userId_courseId: { userId, courseId } } });
}

/** Only enrolled learners can review. */
export async function assertCanReview(userId: string, courseId: string) {
  const enrolment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrolment) throw new ApiError(403, "NOT_ENROLLED", "You can review a course after you enrol in it.");
}

export async function upsertReview(userId: string, courseId: string, rating: number, body?: string) {
  await assertCanReview(userId, courseId);
  const r = Math.min(5, Math.max(1, Math.round(rating)));
  if (!Number.isFinite(r)) throw new ApiError(422, "BAD_RATING", "Pick a rating from 1 to 5.");
  const text = body?.trim().slice(0, 2000) || null;
  return db.review.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, rating: r, body: text },
    update: { rating: r, body: text, status: "VISIBLE" },
  });
}

export async function deleteOwnReview(userId: string, courseId: string) {
  await db.review.deleteMany({ where: { userId, courseId } });
}
