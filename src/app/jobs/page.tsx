import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { listPublicJobs, listJobCategories, JOB_TYPE_LABELS, JOB_LOCATION_LABELS } from "@/lib/jobs/service";
import { cn } from "@/lib/utils";
import { checkMaintenance } from "@/components/maintenance/section-notice";

export const metadata = {
  title: "Jobs",
  description: "Remote and on-site roles in data annotation, AI training, support and more.",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const { notice, banner } = await checkMaintenance("jobs");
  if (notice) return notice;

  const [user, jobs, categories] = await Promise.all([
    getCurrentUser(),
    listPublicJobs({ category: sp.category, type: sp.type, q: sp.q?.trim() }),
    listJobCategories(),
  ]);

  return (
    <div className="min-h-screen">
      {banner}
      <MarketingHeader loggedIn={Boolean(user)} />
      <main className="container py-10">
        <h1 className="font-display text-3xl font-semibold">Jobs</h1>
        <p className="mt-1 text-muted-foreground">
          Real openings at other companies, hand-picked for annotators, AI trainers and remote workers.
          Career Forge doesn&apos;t hire — we point you to the roles, and you apply.
        </p>

        <form className="mt-6 flex flex-wrap gap-2" action="/jobs">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search title or company"
            className="h-9 flex-1 min-w-[200px] rounded-md border border-input bg-card px-3 text-sm"
          />
          <select name="type" defaultValue={sp.type ?? ""} className="h-9 rounded-md border border-input bg-card px-2 text-sm">
            <option value="">Any type</option>
            {Object.entries(JOB_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filter</button>
        </form>

        {categories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/jobs" className={cn("rounded-full border px-3 py-1 text-xs", !sp.category && "border-primary bg-primary text-primary-foreground")}>All</Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/jobs?category=${encodeURIComponent(c)}`}
                className={cn("rounded-full border px-3 py-1 text-xs", sp.category === c && "border-primary bg-primary text-primary-foreground")}
              >
                {c}
              </Link>
            ))}
          </div>
        ) : null}

        {jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs match" description="Try clearing the filters or check back soon." />
        ) : (
          <div className="mt-6 space-y-3">
            {jobs.map((j) => (
              <Link key={j.id} href={`/jobs/${j.slug}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{j.title}</p>
                        {j.featured ? <Badge>Featured</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{j.company}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="size-3" /> {JOB_LOCATION_LABELS[j.locationType]}{j.location ? ` · ${j.location}` : ""}</span>
                        <span>{JOB_TYPE_LABELS[j.type]}</span>
                        {j.salaryText ? <span>{j.salaryText}</span> : null}
                        {j.category ? <span>{j.category}</span> : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(j.postedAt ?? j.createdAt)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
