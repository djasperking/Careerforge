import Link from "next/link";
import { Award, BookOpen, CheckCircle2, GraduationCap, PlayCircle, Search } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseThumb } from "@/components/ui/course-thumb";
import { cn, formatCurrency } from "@/lib/utils";
import { QuickEnroll } from "./quick-enroll";

export const metadata = { title: "My Learning" };

type Filter = "all" | "progress" | "done";

export default async function MyCoursesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const user = await requireUser();
  const { show } = await searchParams;
  const filter: Filter = show === "progress" || show === "done" ? show : "all";

  const [enrollments, certificates] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { position: "asc" },
              include: { lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, type: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.certificate.count({ where: { userId: user.id, revokedAt: null } }),
  ]);

  // Every published course the student has not joined yet, so they can enrol right from here.
  const enrolledIds = enrollments.map((e) => e.courseId);
  const available = await db.course.findMany({
    where: { status: "PUBLISHED", ...(enrolledIds.length ? { id: { notIn: enrolledIds } } : {}) },
    include: { category: true, modules: { select: { _count: { select: { lessons: true } } } } },
    orderBy: [{ priceCents: "asc" }, { publishedAt: "desc" }],
    take: 40,
  });

  const lessonIds = enrollments.flatMap((e) => e.course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  const doneRows = lessonIds.length
    ? await db.courseProgress.findMany({
        where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
        select: { lessonId: true },
      })
    : [];
  const done = new Set(doneRows.map((r) => r.lessonId));

  const items = enrollments.map((e) => {
    const lessons = e.course.modules.flatMap((m) => m.lessons);
    const finished = lessons.filter((l) => done.has(l.id)).length;
    const percent = lessons.length ? Math.round((finished / lessons.length) * 100) : e.progressPercent;
    const next = lessons.find((l) => l.type !== "EXAM" && !done.has(l.id));
    const complete = e.status === "COMPLETED" || (lessons.length > 0 && finished === lessons.length);
    return { e, lessons: lessons.length, finished, percent, next, complete };
  });

  const inProgress = items.filter((i) => !i.complete);
  const completed = items.filter((i) => i.complete);
  const shown = filter === "progress" ? inProgress : filter === "done" ? completed : items;
  const resume = inProgress.find((i) => i.finished > 0) ?? inProgress[0];


  const explore =
    available.length > 0 ? (
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">Explore courses</h2>
            <p className="text-sm text-muted-foreground">Enrol in any course below. Free courses start right away.</p>
          </div>
          <Link href="/courses" className="text-sm font-medium text-primary hover:underline">See the full catalogue</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {available.map((c) => {
            const free = c.priceCents === 0;
            const lessonTotal = c.modules.reduce((n, m) => n + m._count.lessons, 0);
            return (
              <div key={c.id} className="flex flex-col overflow-hidden rounded-xl border bg-card transition hover:border-primary/50 hover:shadow-md">
                <Link href={`/courses/${c.slug}`} className="relative block">
                  <CourseThumb src={c.thumbnailUrl} alt={c.title} className="rounded-none border-0 border-b" />
                  <span
                    className={cn(
                      "absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow",
                      free ? "bg-emerald-500 text-white" : "bg-card text-foreground",
                    )}
                  >
                    {free ? "FREE" : formatCurrency(c.priceCents, c.currency)}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {c.category ? <Badge variant="secondary">{c.category.name}</Badge> : null}
                    <span>{lessonTotal} lessons</span>
                  </div>
                  <Link href={`/courses/${c.slug}`} className="font-display text-base font-semibold leading-snug hover:text-primary">
                    {c.title}
                  </Link>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-auto pt-2">
                    <QuickEnroll courseId={c.id} isFree={free} priceLabel={formatCurrency(c.priceCents, c.currency)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ) : null;

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: items.length },
    { key: "progress", label: "In progress", count: inProgress.length },
    { key: "done", label: "Completed", count: completed.length },
  ];

  if (items.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold">My Learning</h1>
        <div className="mt-6 rounded-2xl border bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-transparent p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-7" />
          </div>
          <h2 className="font-display text-xl font-semibold">Start your first course</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Pick a course, learn at your own pace, and earn a certificate you can add to your CV.
          </p>
          <Button asChild className="mt-5">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
        <div className="mt-8">{explore}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">My Learning</h1>
          <p className="text-sm text-muted-foreground">Pick up where you left off.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/courses">
            <Search className="size-4" /> Find more courses
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={BookOpen} label="In progress" value={inProgress.length} />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} />
        <Stat icon={Award} label="Certificates" value={certificates} href="/dashboard/certificates" />
      </div>

      {resume ? (
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <CourseThumb src={resume.e.course.thumbnailUrl} alt={resume.e.course.title} className="h-full rounded-none border-0" />
            <div className="flex flex-col justify-center gap-3 p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Continue learning</p>
              <h2 className="font-display text-xl font-semibold leading-tight sm:text-2xl">{resume.e.course.title}</h2>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{resume.finished} of {resume.lessons} lessons</span>
                  <span className="font-semibold text-primary">{resume.percent}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500" style={{ width: `${resume.percent}%` }} />
                </div>
              </div>
              {resume.next ? (
                <p className="text-sm text-muted-foreground">
                  Up next: <span className="font-medium text-foreground">{resume.next.title}</span>
                </p>
              ) : null}
              <Button asChild size="lg" className="w-fit">
                <Link href={resume.next ? `/dashboard/courses/${resume.e.courseId}/lessons/${resume.next.id}` : `/dashboard/courses/${resume.e.courseId}`}>
                  <PlayCircle className="size-5" /> {resume.finished === 0 ? "Start course" : "Resume"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter courses">
        {tabs.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={filter === t.key}
            href={t.key === "all" ? "/dashboard/courses" : `/dashboard/courses?show=${t.key}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === t.key ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-primary hover:text-foreground",
            )}
          >
            {t.label} <span className="opacity-70">{t.count}</span>
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={filter === "done" ? "No completed courses yet" : "Nothing in progress"}
          description={filter === "done" ? "Finish a course to see it here." : "Browse the catalogue to start something new."}
          action={
            <Button asChild size="sm">
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map(({ e, lessons, finished, percent, next, complete }) => (
            <Link
              key={e.id}
              href={`/dashboard/courses/${e.courseId}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="relative">
                <CourseThumb src={e.course.thumbnailUrl} alt={e.course.title} className="rounded-none border-0 border-b" />
                {complete ? (
                  <Badge variant="success" className="absolute right-3 top-3 gap-1 shadow">
                    <CheckCircle2 className="size-3.5" /> Completed
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary">{e.course.title}</h3>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{finished} of {lessons} lessons</span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", complete ? "bg-success" : "bg-gradient-to-r from-primary to-fuchsia-500")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <p className="mt-auto truncate text-xs text-muted-foreground">
                  {complete ? "Great work — view your certificate" : next ? `Up next: ${next.title}` : "Open course"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {explore}
    </div>
  );
}

function Stat({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: number; href?: string }) {
  const body = (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
