import Link from "next/link";
import { BookOpen, Clock, GraduationCap, Search, Sparkles, X } from "lucide-react";
import { db } from "@/lib/db";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseThumb } from "@/components/ui/course-thumb";
import { Stars } from "@/components/ui/star-rating";
import { InstructorTag } from "@/components/course/instructor-tag";
import { ratingSummaries } from "@/lib/review/service";
import { cn, formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";
import { checkMaintenance } from "@/components/maintenance/section-notice";

export const metadata = {
  title: "Explore courses",
  description: "Practical, beginner-friendly courses with live code, quizzes, assignments and certificates.",
};

type Params = { q?: string; category?: string; level?: string; price?: string };

const LEVELS: Record<string, string> = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };

function href(sp: Params, patch: Partial<Params>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/courses?${s}` : "/courses";
}

function Chip({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-primary hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export default async function PublicCoursesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { notice, banner } = await checkMaintenance("courses");
  if (notice) return notice;

  const q = sp.q?.trim();
  const level = sp.level && LEVELS[sp.level] ? sp.level : undefined;

  const [courses, categories, user] = await Promise.all([
    db.course.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
        ...(sp.category ? { category: { key: sp.category } } : {}),
        ...(level ? { level: level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" } : {}),
        ...(sp.price === "free" ? { priceCents: 0 } : {}),
      },
      include: {
        category: true,
        instructor: true,
        modules: { select: { _count: { select: { lessons: true } } } },
      },
      orderBy: { publishedAt: "desc" },
      take: 60,
    }),
    db.category.findMany({ where: { courses: { some: { status: "PUBLISHED" } } }, orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);
  const ratings = await ratingSummaries(courses.map((c) => c.id));
  const filtering = Boolean(q || sp.category || level || sp.price);
  const featured = !filtering ? courses[0] : undefined;
  const rest = featured ? courses.slice(1) : courses;

  const lessonCount = (c: (typeof courses)[number]) => c.modules.reduce((n, m) => n + m._count.lessons, 0);
  const hours = (mins: number) => (mins >= 60 ? `${Math.round((mins / 60) * 10) / 10} hrs` : `${Math.max(mins, 1)} min`);

  return (
    <div className={user ? "" : "min-h-screen"}>
      {banner}
      {user ? null : <MarketingHeader loggedIn={false} />}

      <section className="border-b bg-gradient-to-br from-primary/10 via-fuchsia-500/5 to-transparent">
        <div className="container py-10 sm:py-14">
          <p className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> Learn by doing
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Learn a skill. Build something real.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Hands-on courses with live code, quizzes and assignments — and a certificate you can put on your CV.
          </p>

          <form action="/courses" className="mt-6 flex max-w-xl gap-2">
            {sp.category ? <input type="hidden" name="category" value={sp.category} /> : null}
            {level ? <input type="hidden" name="level" value={level} /> : null}
            {sp.price ? <input type="hidden" name="price" value={sp.price} /> : null}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search courses…"
                aria-label="Search courses"
                className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <button type="submit" className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Search
            </button>
          </form>
        </div>
      </section>

      <main className="container py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Chip to={href(sp, { category: undefined })} active={!sp.category}>All</Chip>
          {categories.map((c) => (
            <Chip key={c.id} to={href(sp, { category: c.key })} active={sp.category === c.key}>{c.name}</Chip>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <Chip to={href(sp, { price: sp.price === "free" ? undefined : "free" })} active={sp.price === "free"}>Free</Chip>
          {Object.entries(LEVELS).map(([key, label]) => (
            <Chip key={key} to={href(sp, { level: level === key ? undefined : key })} active={level === key}>{label}</Chip>
          ))}
          {filtering ? (
            <Link href="/courses" className="ml-1 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <X className="size-3.5" /> Clear
            </Link>
          ) : null}
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={filtering ? "No courses match that" : "No published courses yet"}
            description={filtering ? "Try a different search or clear the filters." : "Check back soon."}
          />
        ) : (
          <>
            {featured ? (
              <Link
                href={`/courses/${featured.slug}`}
                className="group mb-8 grid overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:border-primary/50 hover:shadow-md md:grid-cols-2"
              >
                <CourseThumb src={featured.thumbnailUrl} alt={featured.title} className="h-full rounded-none border-0" />
                <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Featured</Badge>
                    {featured.priceCents === 0 ? <Badge variant="success">Free</Badge> : null}
                    <Badge variant="secondary">{LEVELS[featured.level] ?? featured.level}</Badge>
                  </div>
                  <h2 className="font-display text-2xl font-semibold leading-tight">{featured.title}</h2>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{featured.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><BookOpen className="size-4" /> {lessonCount(featured)} lessons</span>
                    {featured.durationMinutes ? (
                      <span className="inline-flex items-center gap-1"><Clock className="size-4" /> {hours(featured.durationMinutes)}</span>
                    ) : null}
                    <span>by <InstructorTag name={featured.instructor?.name} /></span>
                  </div>
                  <span className="mt-1 inline-flex w-fit items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition group-hover:opacity-90">
                    {featured.priceCents === 0 ? "Start learning free" : `View course · ${formatCurrency(featured.priceCents, featured.currency)}`}
                  </span>
                </div>
              </Link>
            ) : null}

            {rest.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((c) => {
                  const r = ratings.get(c.id);
                  return (
                    <Link
                      key={c.id}
                      href={`/courses/${c.slug}`}
                      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="relative">
                        <CourseThumb src={c.thumbnailUrl} alt={c.title} className="rounded-none border-0 border-b" />
                        <span
                          className={cn(
                            "absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow",
                            c.priceCents === 0 ? "bg-emerald-500 text-white" : "bg-card text-foreground",
                          )}
                        >
                          {c.priceCents === 0 ? "FREE" : formatCurrency(c.priceCents, c.currency)}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <div className="flex items-center gap-2 text-xs">
                          {c.category ? <Badge variant="secondary">{c.category.name}</Badge> : null}
                          <span className="text-muted-foreground">{LEVELS[c.level] ?? c.level}</span>
                        </div>
                        <h2 className="font-display text-lg font-semibold leading-snug group-hover:text-primary">{c.title}</h2>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
                          {r?.count ? (
                            <span className="flex items-center gap-1">
                              <Stars value={r.average} size={12} /> {r.average.toFixed(1)}
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1"><BookOpen className="size-3.5" /> {lessonCount(c)} lessons</span>
                          {c.durationMinutes ? (
                            <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {hours(c.durationMinutes)}</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">by <InstructorTag name={c.instructor?.name} /></p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </main>
      {user ? null : <SiteFooter />}
    </div>
  );
}
