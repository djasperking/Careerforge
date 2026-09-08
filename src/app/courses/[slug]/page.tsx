import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { CourseThumb } from "@/components/ui/course-thumb";
import { listOpenCohorts } from "@/lib/cohort/service";
import { courseRatingSummary, listCourseReviews } from "@/lib/review/service";
import { Stars } from "@/components/ui/star-rating";
import { EnrollButton } from "./enroll-button";
import { CohortList } from "./cohort-list";
import { checkMaintenance } from "@/components/maintenance/section-notice";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await db.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { title: true, description: true },
  });
  if (!course) return { title: "Course" };
  return {
    title: course.title,
    description: course.description.slice(0, 300),
    alternates: { canonical: `/courses/${slug}` },
    openGraph: { title: course.title, description: course.description.slice(0, 200), type: "article" },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { notice } = await checkMaintenance("courses");
  if (notice) return notice;
  const [course, user] = await Promise.all([
    db.course.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        category: true,
        instructor: true,
        modules: { include: { lessons: true }, orderBy: { position: "asc" } },
      },
    }),
    getCurrentUser(),
  ]);
  if (!course) notFound();

  const [enrollment, openCohorts, rating, reviews] = await Promise.all([
    user
      ? db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } })
      : Promise.resolve(null),
    listOpenCohorts(course.id),
    courseRatingSummary(course.id),
    listCourseReviews(course.id),
  ]);
  const joinedCohortIds = user
    ? new Set(
        (await db.cohortEnrollment.findMany({
          where: { userId: user.id, cohortId: { in: openCohorts.map((c) => c.id) } },
          select: { cohortId: true },
        })).map((r) => r.cohortId),
      )
    : new Set<string>();
  const waitlistedCohortIds = user
    ? new Set(
        (await db.cohortWaitlist.findMany({
          where: { userId: user.id, cohortId: { in: openCohorts.map((c) => c.id) } },
          select: { cohortId: true },
        })).map((r) => r.cohortId),
      )
    : new Set<string>();
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="container grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CourseThumb src={course.thumbnailUrl} alt={course.title} className="mb-6" />
          {course.category ? <Badge variant="secondary">{course.category.name}</Badge> : null}
          <h1 className="mt-3 font-display text-3xl font-semibold">{course.title}</h1>
          <p className="mt-3 text-muted-foreground">{course.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {rating.count > 0 ? (
              <a href="#reviews" className="flex items-center gap-1.5 text-foreground">
                <Stars value={rating.average} />
                <span className="font-medium">{rating.average.toFixed(1)}</span>
                <span className="text-muted-foreground">({rating.count})</span>
              </a>
            ) : null}
            <span className="flex items-center gap-1"><BarChart3 className="size-4" /> {course.level}</span>
            <span className="flex items-center gap-1"><Clock className="size-4" /> {course.durationMinutes} min · {lessonCount} lessons</span>
            <span>By {course.instructor?.name ?? "Career Forge"}</span>
          </div>

          {course.objectives.length ? (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold">What you&apos;ll learn</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {course.objectives.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {o}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {course.requirements.length ? (
            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold">Requirements</h2>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {course.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <CohortList
            courseId={course.id}
            slug={course.slug}
            isLoggedIn={!!user}
            ownsCourse={!!enrollment}
            cohorts={openCohorts.map((c) => ({
              id: c.id,
              title: c.title,
              startDate: c.startDate.toISOString(),
              endDate: c.endDate.toISOString(),
              enrollByDate: c.enrollByDate ? c.enrollByDate.toISOString() : null,
              priceCents: c.priceCents ?? course.priceCents,
              currency: c.currency,
              seatsLeft: c.seatsLeft,
              scheduleNote: c.scheduleNote,
              joined: joinedCohortIds.has(c.id),
              waitlisted: waitlistedCohortIds.has(c.id),
            }))}
          />

          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold">Curriculum</h2>
            <div className="mt-3 space-y-3">
              {course.modules.map((m) => (
                <div key={m.id} className="rounded-lg border p-4">
                  <p className="font-medium">{m.title}</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="flex items-center justify-between">
                        <span>{l.title}</span>
                        {l.isPreview ? <Badge variant="secondary">Preview</Badge> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {rating.count > 0 ? (
            <div id="reviews" className="mt-10 scroll-mt-20">
              <h2 className="font-display text-lg font-semibold">
                Reviews <span className="text-muted-foreground">· {rating.average.toFixed(1)} out of 5 ({rating.count})</span>
              </h2>
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.user.name ?? "Learner"}</span>
                      <Stars value={r.rating} size={14} />
                    </div>
                    {r.body ? <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <div className="sticky top-6 rounded-lg border bg-card p-6">
            <p className="font-display text-2xl font-semibold">
              {course.priceCents === 0 ? "Free" : formatCurrency(course.priceCents, course.currency)}
            </p>
            <div className="mt-4">
              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                isLoggedIn={!!user}
                alreadyEnrolled={!!enrollment}
                isFree={course.priceCents === 0}
              />
            </div>
          </div>
          <div className="mt-4">
            <AdSlot placement="COURSE_PAGE" path={`/courses/${course.slug}`} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
