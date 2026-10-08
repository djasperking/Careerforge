import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Search, X } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCard } from "@/components/jobs/job-card";
import {
  searchPublicJobs,
  listJobCategories,
  jobBoardStats,
  JOB_TYPE_LABELS,
  JOB_LOCATION_LABELS,
} from "@/lib/jobs/service";
import { matchedJobsForUser } from "@/lib/jobs/matching";
import { checkMaintenance } from "@/components/maintenance/section-notice";

export const metadata = {
  title: "Jobs",
  description: "Remote roles in data annotation, AI training, support and more — real openings, with the employer's own apply link.",
};

type Params = { category?: string; type?: string; q?: string; location?: string; page?: string };

const SELECT =
  "h-10 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function href(sp: Params, patch: Partial<Params>) {
  const next = { ...sp, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/jobs?${s}` : "/jobs";
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { notice, banner } = await checkMaintenance("jobs");
  if (notice) return notice;

  const user = await getCurrentUser();
  const [result, categories, stats, matchedJobs] = await Promise.all([
    searchPublicJobs({
      category: sp.category,
      type: sp.type,
      location: sp.location,
      q: sp.q?.trim(),
      page: Number(sp.page) || 1,
    }),
    listJobCategories(),
    jobBoardStats(),
    user ? matchedJobsForUser(user.id) : Promise.resolve([]),
  ]);
  const { jobs, total, page, pages } = result;
  const matchedIds = new Set(matchedJobs.map((m) => m.id));

  const active: { label: string; clear: string }[] = [];
  if (sp.q?.trim()) active.push({ label: `“${sp.q.trim()}”`, clear: href(sp, { q: undefined, page: undefined }) });
  if (sp.location) active.push({ label: JOB_LOCATION_LABELS[sp.location] ?? sp.location, clear: href(sp, { location: undefined, page: undefined }) });
  if (sp.type) active.push({ label: JOB_TYPE_LABELS[sp.type] ?? sp.type, clear: href(sp, { type: undefined, page: undefined }) });
  if (sp.category) active.push({ label: sp.category, clear: href(sp, { category: undefined, page: undefined }) });

  return (
    <div className="min-h-screen">
      {banner}
      <MarketingHeader loggedIn={Boolean(user)} />

      <section className="border-b bg-muted/30">
        <div className="container py-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Find remote work</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Real openings in data annotation, AI training, support and more. Each one links to the employer&apos;s own
            application page — Career Forge doesn&apos;t hire, we point you to the roles.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span><b className="font-semibold">{stats.total}</b> <span className="text-muted-foreground">open roles</span></span>
            <span><b className="font-semibold">{stats.remote}</b> <span className="text-muted-foreground">remote</span></span>
            <span><b className="font-semibold">{stats.thisWeek}</b> <span className="text-muted-foreground">added this week</span></span>
            <Link href="/jobs/today" className="font-medium text-primary hover:underline">
              Share this week&apos;s list on WhatsApp / Telegram →
            </Link>
          </div>
        </div>
      </section>

      <main className="container py-8">
        {matchedJobs.length > 0 ? (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="font-display text-base font-semibold">Suited to you</p>
            <p className="mb-3 text-xs text-muted-foreground">Matched to the skills and experience on your CV.</p>
            <div className="flex flex-wrap gap-2">
              {matchedJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.slug}`}
                  className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-sm font-medium hover:border-primary"
                >
                  {j.title} <span className="text-muted-foreground">· {j.company}</span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <form action="/jobs" className="grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search job title or company"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>
          <select name="location" defaultValue={sp.location ?? ""} className={SELECT} aria-label="Work mode">
            <option value="">Any work mode</option>
            {Object.entries(JOB_LOCATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="type" defaultValue={sp.type ?? ""} className={SELECT} aria-label="Job type">
            <option value="">Any type</option>
            {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="category" defaultValue={sp.category ?? ""} className={SELECT} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
          </select>
          <button className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {total === 0 ? "No jobs" : `${total} job${total === 1 ? "" : "s"}`}
            {pages > 1 ? ` · page ${page} of ${pages}` : ""}
          </span>
          {active.map((a) => (
            <Link
              key={a.label}
              href={a.clear}
              className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs hover:border-primary"
              aria-label={`Remove filter ${a.label}`}
            >
              {a.label} <X className="size-3" />
            </Link>
          ))}
          {active.length > 1 ? (
            <Link href="/jobs" className="text-xs text-primary hover:underline">Clear all</Link>
          ) : null}
        </div>

        {jobs.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={Briefcase}
              title="No jobs match those filters"
              description="Try a broader search, or clear the filters to see every open role."
              action={<Link href="/jobs" className="text-sm font-medium text-primary hover:underline">Clear filters</Link>}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} suited={matchedIds.has(j.id)} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
            {page > 1 ? (
              <Link href={href(sp, { page: String(page - 1) })} className="inline-flex items-center gap-1 rounded-md border bg-card px-4 py-2 text-sm hover:border-primary">
                <ArrowLeft className="size-4" /> Newer
              </Link>
            ) : <span />}
            <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
            {page < pages ? (
              <Link href={href(sp, { page: String(page + 1) })} className="inline-flex items-center gap-1 rounded-md border bg-card px-4 py-2 text-sm hover:border-primary">
                Older <ArrowRight className="size-4" />
              </Link>
            ) : <span />}
          </nav>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
