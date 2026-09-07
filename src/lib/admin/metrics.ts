import { db } from "@/lib/db";

const DAY = 86_400_000;

export type RangeKey = "7d" | "30d" | "90d";
export const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

export function rangeDays(key: string | undefined): { key: RangeKey; days: number } {
  const found = RANGES.find((r) => r.key === key) ?? RANGES[1];
  return { key: found.key, days: found.days };
}

/** Bucket a list of dates into a zero-filled daily series ending today (UTC). */
function bucketDaily(dates: Date[], days: number): { date: string; value: number }[] {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const startMs = start.getTime() - (days - 1) * DAY;
  const buckets = new Array(days).fill(0);
  for (const d of dates) {
    const idx = Math.floor((d.getTime() - startMs) / DAY);
    if (idx >= 0 && idx < days) buckets[idx] += 1;
  }
  return buckets.map((value, i) => ({
    date: new Date(startMs + i * DAY).toISOString().slice(0, 10),
    value,
  }));
}

function bucketDailySum(rows: { at: Date; amount: number }[], days: number): { date: string; value: number }[] {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const startMs = start.getTime() - (days - 1) * DAY;
  const buckets = new Array(days).fill(0);
  for (const r of rows) {
    const idx = Math.floor((r.at.getTime() - startMs) / DAY);
    if (idx >= 0 && idx < days) buckets[idx] += r.amount;
  }
  return buckets.map((value, i) => ({
    date: new Date(startMs + i * DAY).toISOString().slice(0, 10),
    value,
  }));
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** KPIs for the admin home, each with a 30-day-over-prior-30-day delta. */
export async function getAdminOverview() {
  const now = Date.now();
  const d30 = new Date(now - 30 * DAY);
  const d60 = new Date(now - 60 * DAY);
  const d7 = new Date(now - 7 * DAY);
  const soon = new Date(now + 14 * DAY);

  const [
    usersTotal, users30, usersPrev30,
    revAll, rev30, revPrev30,
    enrollTotal, enroll30, enrollPrev30,
    ai30, aiPrev30,
    pendingInstructors, coursesInReview, marketplaceInReview,
    openTickets, failedTx, payoutRequests, cohortsSoon,
    activeUsers,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.user.count({ where: { createdAt: { gte: d30 } } }),
    db.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    db.transaction.aggregate({ _sum: { amountCents: true }, where: { status: "SUCCESS" } }),
    db.transaction.aggregate({ _sum: { amountCents: true }, where: { status: "SUCCESS", paidAt: { gte: d30 } } }),
    db.transaction.aggregate({ _sum: { amountCents: true }, where: { status: "SUCCESS", paidAt: { gte: d60, lt: d30 } } }),
    db.enrollment.count(),
    db.enrollment.count({ where: { createdAt: { gte: d30 } } }),
    db.enrollment.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    db.aIRequest.count({ where: { createdAt: { gte: d30 } } }),
    db.aIRequest.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    db.instructorProfile.count({ where: { status: "PENDING" } }),
    db.course.count({ where: { reviewStatus: "SUBMITTED" } }),
    Promise.all([
      db.digitalProduct.count({ where: { reviewStatus: "SUBMITTED" } }),
      db.coachingOffer.count({ where: { reviewStatus: "SUBMITTED" } }),
    ]).then(([a, b]) => a + b),
    db.supportTicket.count({ where: { status: { in: ["OPEN", "PENDING"] } } }),
    db.transaction.count({ where: { status: "VERIFICATION_FAILED" } }),
    db.payout.count({ where: { status: "REQUESTED" } }),
    db.cohort.count({ where: { status: "OPEN", startDate: { gte: new Date(now), lte: soon } } }),
    db.user.count({ where: { lastLoginAt: { gte: d30 } } }),
  ]);

  return {
    kpis: {
      revenue: {
        value: revAll._sum.amountCents ?? 0,
        last30: rev30._sum.amountCents ?? 0,
        delta: pctDelta(rev30._sum.amountCents ?? 0, revPrev30._sum.amountCents ?? 0),
      },
      users: { value: usersTotal, last30: users30, delta: pctDelta(users30, usersPrev30) },
      enrollments: { value: enrollTotal, last30: enroll30, delta: pctDelta(enroll30, enrollPrev30) },
      ai: { value: ai30, last30: ai30, delta: pctDelta(ai30, aiPrev30) },
      activeUsers,
    },
    attention: {
      pendingInstructors,
      coursesInReview: coursesInReview + marketplaceInReview,
      openTickets,
      failedTx,
      payoutRequests,
      cohortsSoon,
    },
    d7,
  };
}

export async function getAnalytics(days: number) {
  const start = new Date(Date.now() - days * DAY);

  const [signups, txns, enrolls, aiRows, revByTypeRaw, topCoursesRaw] = await Promise.all([
    db.user.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    db.transaction.findMany({
      where: { status: "SUCCESS", paidAt: { gte: start } },
      select: { paidAt: true, amountCents: true, productType: true },
    }),
    db.enrollment.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } }),
    db.aIRequest.groupBy({ by: ["feature"], _count: { _all: true }, where: { createdAt: { gte: start } } }),
    db.transaction.groupBy({
      by: ["productType"],
      _sum: { amountCents: true },
      _count: { _all: true },
      where: { status: "SUCCESS", paidAt: { gte: start } },
    }),
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { _all: true },
      where: { createdAt: { gte: start } },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
  ]);

  const courseNames = new Map(
    (await db.course.findMany({ where: { id: { in: topCoursesRaw.map((c) => c.courseId) } }, select: { id: true, title: true } })).map(
      (c) => [c.id, c.title],
    ),
  );

  const revenueTotal = txns.reduce((s, t) => s + t.amountCents, 0);

  return {
    signupSeries: bucketDaily(signups.map((s) => s.createdAt), days),
    revenueSeries: bucketDailySum(
      txns.filter((t) => t.paidAt).map((t) => ({ at: t.paidAt as Date, amount: t.amountCents })),
      days,
    ),
    enrollmentSeries: bucketDaily(enrolls.map((e) => e.createdAt), days),
    revenueTotal,
    signupsTotal: signups.length,
    enrollmentsTotal: enrolls.length,
    revenueByType: revByTypeRaw
      .map((r) => ({ type: r.productType, amount: r._sum.amountCents ?? 0, count: r._count._all }))
      .sort((a, b) => b.amount - a.amount),
    aiByFeature: aiRows
      .map((r) => ({ feature: r.feature, count: r._count._all }))
      .sort((a, b) => b.count - a.count),
    topCourses: topCoursesRaw.map((c) => ({
      title: courseNames.get(c.courseId) ?? "—",
      count: c._count._all,
    })),
  };
}
