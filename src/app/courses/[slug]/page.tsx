import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { AdSlot } from "@/components/ads/ad-slot";
import { EnrollButton } from "./enroll-button";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

  const enrollment = user
    ? await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } })
    : null;
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Brand />
          <Button asChild size="sm" variant={user ? "default" : "outline"}>
            <Link href={user ? "/dashboard" : "/login"}>{user ? "Dashboard" : "Log in"}</Link>
          </Button>
        </div>
      </header>

      <main className="container grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {course.category ? <Badge variant="secondary">{course.category.name}</Badge> : null}
          <h1 className="mt-3 font-display text-3xl font-semibold">{course.title}</h1>
          <p className="mt-3 text-muted-foreground">{course.description}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
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
        </div>

        <div>
          <div className="sticky top-6 rounded-lg border bg-card p-6">
            <p className="font-display text-2xl font-semibold">
              {course.priceCents === 0 ? "Free" : formatCurrency(course.priceCents, course.currency)}
            </p>
            <div className="mt-4">
              <EnrollButton
                courseId={course.id}
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
    </div>
  );
}
