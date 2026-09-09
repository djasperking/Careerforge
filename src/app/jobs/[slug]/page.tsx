import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { JOB_TYPE_LABELS, JOB_LOCATION_LABELS } from "@/lib/jobs/service";
import { checkMaintenance } from "@/components/maintenance/section-notice";
import { renderMarkdown } from "@/lib/markdown";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await db.jobPost.findFirst({ where: { slug, status: "PUBLISHED" } });
  return job ? { title: `${job.title} · ${job.company}` } : { title: "Job" };
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

  const expired = job.expiresAt && job.expiresAt.getTime() < Date.now();

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />
      <main className="container max-w-3xl py-10">
        <Link href="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> All jobs
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-semibold">{job.title}</h1>
          {job.featured ? <Badge>Featured</Badge> : null}
        </div>
        <p className="mt-1 flex items-center gap-2 text-muted-foreground">
          <Building2 className="size-4" /> {job.company}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {JOB_LOCATION_LABELS[job.locationType]}{job.location ? ` · ${job.location}` : ""}</span>
          <span>{JOB_TYPE_LABELS[job.type]}</span>
          {job.salaryText ? <span>{job.salaryText}</span> : null}
          {job.category ? <span>{job.category}</span> : null}
          <span>Posted {formatDate(job.postedAt ?? job.createdAt)}</span>
        </div>

        <div
          className="prose prose-sm mt-8 max-w-none text-foreground dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(job.description) }}
        />

        {job.howToApply ? (
          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold">How to apply</h2>
            <div
              className="prose prose-sm mt-2 max-w-none text-foreground dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(job.howToApply) }}
            />
          </div>
        ) : null}

        <div className="mt-8 rounded-lg border bg-card p-5">
          {expired ? (
            <p className="text-sm text-muted-foreground">This listing has closed.</p>
          ) : (
            <>
              <Button asChild size="lg">
                <a href={`/api/jobs/${job.id}/apply`} target="_blank" rel="noopener noreferrer">
                  Apply for this role
                </a>
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Opens the employer&apos;s application page. Career Forge may earn a referral fee when you apply through this link — it costs you nothing.
              </p>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
