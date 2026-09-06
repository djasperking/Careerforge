import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InstructorApplicationRow } from "./application-row";
import { CourseReviewRow } from "./course-review-row";

export const metadata = { title: "Review queue" };

export default async function AdminReviewQueue() {
  await requirePermissionPage("instructors:review");

  const [applications, courses] = await Promise.all([
    db.instructorProfile.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { appliedAt: "asc" },
    }),
    db.course.findMany({
      where: { reviewStatus: "SUBMITTED" },
      include: {
        instructor: { select: { name: true, email: true } },
        _count: { select: { modules: true } },
      },
      orderBy: { submittedAt: "asc" },
    }),
  ]);

  const courseIds = courses.map((c) => c.id);
  const lessonCounts = courseIds.length
    ? await db.lesson.groupBy({
        by: ["moduleId"],
        where: { module: { courseId: { in: courseIds } } },
        _count: true,
      })
    : [];
  const modulesByCourse = courseIds.length
    ? await db.courseModule.findMany({ where: { courseId: { in: courseIds } }, select: { id: true, courseId: true } })
    : [];
  const lessonTotal: Record<string, number> = {};
  for (const m of modulesByCourse) {
    const c = lessonCounts.find((l) => l.moduleId === m.id);
    lessonTotal[m.courseId] = (lessonTotal[m.courseId] ?? 0) + (c?._count ?? 0);
  }

  return (
    <div>
      <PageHeader
        title="Review queue"
        description="Approve new instructors and course submissions before they go live."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Instructor applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No pending applications.</p>
          ) : (
            <ul className="space-y-4">
              {applications.map((a) => (
                <li key={a.id}>
                  <InstructorApplicationRow
                    id={a.id}
                    name={a.user.name}
                    email={a.user.email}
                    headline={a.headline}
                    bio={a.bio}
                    expertise={a.expertise}
                    linkedinUrl={a.linkedinUrl}
                    portfolioUrl={a.portfolioUrl}
                    appliedAt={formatDate(a.appliedAt)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Courses awaiting review ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No courses awaiting review.</p>
          ) : (
            <ul className="space-y-4">
              {courses.map((c) => (
                <li key={c.id}>
                  <CourseReviewRow
                    id={c.id}
                    title={c.title}
                    instructor={c.instructor?.name || c.instructor?.email || "Unknown"}
                    priceLabel={formatCurrency(c.priceCents, c.currency)}
                    discountPercent={c.discountPercent}
                    discountEndsAt={c.discountEndsAt ? formatDate(c.discountEndsAt) : null}
                    revenueSharePercent={c.revenueSharePercent}
                    moduleCount={c._count.modules}
                    lessonCount={lessonTotal[c.id] ?? 0}
                    submittedAt={c.submittedAt ? formatDate(c.submittedAt) : "—"}
                    previewHref={`/admin/courses/${c.id}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Full course content is on the{" "}
        <Link href="/admin/courses" className="text-primary hover:underline">course admin</Link> pages.
      </p>
    </div>
  );
}
