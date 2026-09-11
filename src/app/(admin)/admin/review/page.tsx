import Link from "next/link";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InstructorApplicationRow } from "./application-row";
import { CourseReviewRow } from "./course-review-row";
import { MarketplaceReviewRow } from "./marketplace-review-row";

export const metadata = { title: "Review queue" };

export default async function AdminReviewQueue() {
  const user = await requireUser();
  const canInstructors = hasPermission(user.permissions, "instructors:review");
  const canSubmissions = hasPermission(user.permissions, "submissions:review");
  if (!canInstructors && !canSubmissions) redirect("/dashboard");

  const [applications, courses, products, coaching] = await Promise.all([
    canInstructors
      ? db.instructorProfile.findMany({
          where: { status: "PENDING" },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { appliedAt: "asc" },
        })
      : Promise.resolve([]),
    canSubmissions
      ? db.course.findMany({
          where: { reviewStatus: "SUBMITTED" },
          include: {
            instructor: { select: { name: true, email: true } },
            _count: { select: { modules: true } },
          },
          orderBy: { submittedAt: "asc" },
        })
      : Promise.resolve([]),
    canSubmissions
      ? db.digitalProduct.findMany({
          where: { reviewStatus: "SUBMITTED" },
          include: { seller: { select: { name: true, email: true } } },
          orderBy: { submittedAt: "asc" },
        })
      : Promise.resolve([]),
    canSubmissions
      ? db.coachingOffer.findMany({
          where: { reviewStatus: "SUBMITTED" },
          include: { coach: { select: { name: true, email: true } } },
          orderBy: { submittedAt: "asc" },
        })
      : Promise.resolve([]),
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

      {canInstructors ? (
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
      ) : null}

      {canSubmissions ? (
      <>
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Digital products awaiting review ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing awaiting review.</p>
          ) : (
            <ul className="space-y-4">
              {products.map((p) => (
                <li key={p.id}>
                  <MarketplaceReviewRow
                    kind="product"
                    id={p.id}
                    title={p.title}
                    seller={p.seller?.name || p.seller?.email || "Unknown"}
                    priceLabel={
                      p.discountPercent && p.discountPercent > 0
                        ? `${formatCurrency(p.priceCents, p.currency)} (${p.discountPercent}% off)`
                        : formatCurrency(p.priceCents, p.currency)
                    }
                    meta={
                      p.deliveryType !== "FILE"
                        ? `Video · ${p.deliveryType === "HOSTED_VIDEO" ? "hosted" : (p.videoProvider ?? "link")}`
                        : p.fileName || "File"
                    }
                    revenueSharePercent={p.revenueSharePercent}
                    submittedAt={p.submittedAt ? formatDate(p.submittedAt) : "—"}
                    previewHref={`/products/${p.slug}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Coaching offers awaiting review ({coaching.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {coaching.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing awaiting review.</p>
          ) : (
            <ul className="space-y-4">
              {coaching.map((o) => (
                <li key={o.id}>
                  <MarketplaceReviewRow
                    kind="coaching"
                    id={o.id}
                    title={o.title}
                    seller={o.coach?.name || o.coach?.email || "Unknown"}
                    priceLabel={formatCurrency(o.priceCents, o.currency)}
                    meta={`${o.durationMinutes} min session`}
                    revenueSharePercent={o.revenueSharePercent}
                    submittedAt={o.submittedAt ? formatDate(o.submittedAt) : "—"}
                    previewHref={`/coaching/${o.slug}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      </>
      ) : null}

      {canSubmissions ? (
      <p className="mt-6 text-sm text-muted-foreground">
        Full course content is on the{" "}
        <Link href="/admin/courses" className="text-primary hover:underline">course admin</Link> pages.
      </p>
      ) : null}
    </div>
  );
}
