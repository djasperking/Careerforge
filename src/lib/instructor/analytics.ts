import { db } from "@/lib/db";

const DAY = 86_400_000;

function bucket(rows: { at: Date; v: number }[], days: number) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const startMs = start.getTime() - (days - 1) * DAY;
  const b = new Array(days).fill(0);
  for (const r of rows) {
    const i = Math.floor((r.at.getTime() - startMs) / DAY);
    if (i >= 0 && i < days) b[i] += r.v;
  }
  return b.map((value, i) => ({ date: new Date(startMs + i * DAY).toISOString().slice(0, 10), value }));
}

export async function getInstructorAnalytics(instructorId: string, days: number) {
  const start = new Date(Date.now() - days * DAY);

  const [earnings, courseIds] = await Promise.all([
    db.instructorEarning.findMany({
      where: { instructorId, status: { not: "REVERSED" }, createdAt: { gte: start } },
      select: { createdAt: true, grossCents: true, netCents: true, productType: true, productId: true, description: true },
    }),
    db.course.findMany({ where: { instructorId }, select: { id: true } }).then((c) => c.map((x) => x.id)),
  ]);

  const [enrolments, allTimeEarnings, students] = await Promise.all([
    courseIds.length
      ? db.enrollment.findMany({
          where: { courseId: { in: courseIds }, createdAt: { gte: start } },
          select: { createdAt: true },
        })
      : Promise.resolve([]),
    db.instructorEarning.aggregate({
      where: { instructorId, status: { not: "REVERSED" } },
      _sum: { grossCents: true, netCents: true },
      _count: { _all: true },
    }),
    courseIds.length
      ? db.enrollment.findMany({ where: { courseId: { in: courseIds } }, select: { userId: true }, distinct: ["userId"] })
      : Promise.resolve([]),
  ]);

  const revenueByType = new Map<string, number>();
  const itemCounts = new Map<string, { label: string; gross: number; count: number }>();
  for (const e of earnings) {
    revenueByType.set(e.productType, (revenueByType.get(e.productType) ?? 0) + e.grossCents);
    const key = `${e.productType}:${e.productId ?? "—"}`;
    const cur = itemCounts.get(key) ?? { label: e.description ?? e.productType, gross: 0, count: 0 };
    cur.gross += e.grossCents;
    cur.count += 1;
    itemCounts.set(key, cur);
  }

  return {
    revenueSeries: bucket(earnings.map((e) => ({ at: e.createdAt, v: e.grossCents })), days),
    salesSeries: bucket(earnings.map((e) => ({ at: e.createdAt, v: 1 })), days),
    enrolmentSeries: bucket(enrolments.map((e) => ({ at: e.createdAt, v: 1 })), days),
    periodGross: earnings.reduce((s, e) => s + e.grossCents, 0),
    periodNet: earnings.reduce((s, e) => s + e.netCents, 0),
    periodSales: earnings.length,
    periodEnrolments: enrolments.length,
    lifetime: {
      gross: allTimeEarnings._sum.grossCents ?? 0,
      net: allTimeEarnings._sum.netCents ?? 0,
      sales: allTimeEarnings._count._all,
      students: students.length,
    },
    revenueByType: [...revenueByType.entries()].map(([type, amount]) => ({ type, amount })).sort((a, b) => b.amount - a.amount),
    topItems: [...itemCounts.values()].sort((a, b) => b.gross - a.gross).slice(0, 5),
  };
}
