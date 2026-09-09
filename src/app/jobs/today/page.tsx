import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, MapPin, ArrowRight, Share2 } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SharePanel } from "@/components/ui/share-panel";
import { formatDate } from "@/lib/utils";
import { appUrl } from "@/lib/email";
import { listRecentJobs, JOB_TYPE_LABELS, JOB_LOCATION_LABELS } from "@/lib/jobs/service";
import { checkMaintenance } from "@/components/maintenance/section-notice";
import { CopyText } from "./copy-text";

const PAGE_URL = appUrl("/jobs/today");

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export async function generateMetadata(): Promise<Metadata> {
  const jobs = await listRecentJobs();
  const title = `${jobs.length} remote & online jobs this week — ${todayLabel()}`;
  const description =
    jobs.length > 0
      ? `Hand-picked openings for annotators, AI trainers, support and remote workers: ${jobs
          .slice(0, 4)
          .map((j) => j.title)
          .join(", ")}${jobs.length > 4 ? " and more" : ""}. Apply free on Career Forge.`
      : "Fresh remote and online job openings, updated weekly on Career Forge.";
  return {
    title,
    description,
    alternates: { canonical: "/jobs/today" },
    openGraph: {
      title,
      description,
      url: PAGE_URL,
      type: "website",
      images: [{ url: "/og-jobs.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og-jobs.png"] },
  };
}

export default async function JobsTodayPage() {
  const { notice, banner } = await checkMaintenance("jobs");
  if (notice) return notice;

  const [user, jobs] = await Promise.all([getCurrentUser(), listRecentJobs()]);

  const shareText =
    `🧑‍💻 ${jobs.length} remote & online jobs this week (${todayLabel()})\n\n` +
    jobs
      .slice(0, 12)
      .map((j) => `• ${j.title} — ${j.company}${j.salaryText ? ` (${j.salaryText})` : ""}`)
      .join("\n") +
    `\n\nSee all + apply free 👉 ${PAGE_URL}`;

  return (
    <div className="min-h-screen">
      {banner}
      <MarketingHeader loggedIn={Boolean(user)} />
      <main className="container py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Jobs this week · {todayLabel()}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            {jobs.length > 0 ? `${jobs.length} remote & online ${jobs.length === 1 ? "job" : "jobs"}` : "Jobs board"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Openings for annotators, AI trainers, virtual assistants and remote workers — hand-picked and refreshed
            weekly. Career Forge doesn&apos;t hire; we point you to the roles and you apply.
          </p>

          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 font-medium">
              <Share2 className="size-4 text-primary" /> Know someone job-hunting? Forward this.
            </p>
            <div className="mt-3">
              <SharePanel
                url={PAGE_URL}
                intro="Share the page — the link preview shows this week's count."
                shareText={`${jobs.length} remote & online jobs this week on Career Forge:`}
              />
            </div>
            <div className="mt-3">
              <CopyText text={shareText} />
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-8">
              <EmptyState icon={Briefcase} title="No jobs posted yet" description="Check back soon — new roles are added weekly." />
            </div>
          ) : (
            <div className="mt-8 space-y-3">
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
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" /> {JOB_LOCATION_LABELS[j.locationType]}
                            {j.location ? ` · ${j.location}` : ""}
                          </span>
                          <span>{JOB_TYPE_LABELS[j.type]}</span>
                          {j.salaryText ? <span>{j.salaryText}</span> : null}
                          {j.category ? <span>{j.category}</span> : null}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(j.postedAt ?? j.createdAt)}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold">Applying? Send a CV that gets read.</p>
              <p className="text-sm text-muted-foreground">Build one free in a few minutes — no account needed to start.</p>
            </div>
            <Link
              href="/dashboard/cvs/new"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Build my CV free <ArrowRight className="size-4" />
            </Link>
          </div>

          <p className="mt-6 text-center text-sm">
            <Link href="/jobs" className="font-medium text-primary hover:underline">
              Browse the full jobs board →
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
