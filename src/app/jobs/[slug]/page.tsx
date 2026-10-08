import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Clock, Wallet, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { CompanyMark } from "@/components/jobs/company-mark";
import { JobCard } from "@/components/jobs/job-card";
import { isNewJob, postedAgo } from "@/lib/jobs/format";
import { JOB_TYPE_LABELS, JOB_LOCATION_LABELS, listSimilarJobs } from "@/lib/jobs/service";
import { checkMaintenance } from "@/components/maintenance/section-notice";
import { renderMarkdown } from "@/lib/markdown";
import { appUrl } from "@/lib/email";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await db.jobPost.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!job) return { title: "Job" };
  const summary = job.description.replace(/\s+/g, " ").slice(0, 155);
  return {
    title: `${job.title} · ${job.company}`,
    description: summary,
    alternates: { canonical: `/jobs/${slug}` },
    openGraph: { title: `${job.title} at ${job.company}`, description: summary, type: "article" },
  };
}

function Fact({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" /> {children}
    </span>
  );
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { notice } = await checkMaintenance("jobs");
  if (notice) return notice;
  const [job, user] = await Promise.all([
    db.jobPost.findFirst({ where: { slug, status: "PUBLISHED" } }),
    getCurrentUser(),
  ]);
  if (!job) notFound();

  const expired = !!job.expiresAt && job.expiresAt.getTime() < Date.now();
  const when = job.postedAt ?? job.createdAt;
  const remote = job.locationType === "REMOTE";
  const similar = await listSimilarJobs(job);

  // Structured data so Google can show this as a job listing.
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description.replace(/\n/g, "<br/>"),
    datePosted: when.toISOString(),
    hiringOrganization: { "@type": "Organization", name: job.company },
    employmentType: { FULL_TIME: "FULL_TIME", PART_TIME: "PART_TIME", CONTRACT: "CONTRACTOR", FREELANCE: "CONTRACTOR", INTERNSHIP: "INTERN" }[job.type],
    url: appUrl(`/jobs/${job.slug}`),
    directApply: false,
    ...(job.expiresAt ? { validThrough: job.expiresAt.toISOString() } : {}),
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: job.location || "Worldwide" } }
      : job.location
        ? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } } }
        : {}),
  };

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />

      <main className="container max-w-3xl py-8">
        <Link href="/jobs" className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All jobs
        </Link>

        <header className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <CompanyMark name={job.company} logoUrl={job.companyLogoUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{job.title}</h1>
                {job.featured ? <Badge>Featured</Badge> : null}
                {isNewJob(when) ? <Badge variant="success">New</Badge> : null}
              </div>
              <p className="mt-1 text-muted-foreground">{job.company}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <Fact icon={MapPin}>
              <span className={cn(remote && "font-medium text-success")}>{JOB_LOCATION_LABELS[job.locationType]}</span>
              {job.location ? ` · ${job.location}` : ""}
            </Fact>
            <Fact icon={Clock}>{JOB_TYPE_LABELS[job.type]}</Fact>
            {job.salaryText ? <Fact icon={Wallet}><span className="font-medium text-foreground">{job.salaryText}</span></Fact> : null}
            {job.category ? <Fact icon={Tag}>{job.category}</Fact> : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-5">
            {expired ? (
              <p className="text-sm text-muted-foreground">This listing has closed.</p>
            ) : (
              <Button asChild size="lg">
                <a href={`/api/jobs/${job.id}/apply`} target="_blank" rel="noopener noreferrer">
                  Apply on the employer&apos;s site <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
            <CopyLinkButton url={appUrl(`/jobs/${job.slug}`)} label="Copy link" />
            <span className="ml-auto text-xs text-muted-foreground">
              Posted {postedAgo(when)}
              {job.sourceName ? ` · via ${job.sourceName}` : ""}
            </span>
          </div>
        </header>

        <section className="mt-6 rounded-xl border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">About the role</h2>
          <div
            className="prose prose-sm mt-3 max-w-none text-foreground dark:prose-invert prose-headings:font-display prose-headings:text-foreground"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(job.description) }}
          />
        </section>

        {job.howToApply ? (
          <section className="mt-6 rounded-xl border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">How to apply</h2>
            <div
              className="prose prose-sm mt-3 max-w-none text-foreground dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(job.howToApply) }}
            />
          </section>
        ) : null}

        {!expired ? (
          <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div>
              <p className="font-display text-base font-semibold">Interested in this role?</p>
              <p className="text-sm text-muted-foreground">You&apos;ll apply directly with {job.company} — it opens in a new tab.</p>
            </div>
            <Button asChild>
              <a href={`/api/jobs/${job.id}/apply`} target="_blank" rel="noopener noreferrer">
                Apply now <ExternalLink className="size-4" />
              </a>
            </Button>
          </section>
        ) : null}

        {similar.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold">More jobs like this</h2>
            <div className="mt-3 space-y-3">
              {similar.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
