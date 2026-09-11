import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobForm } from "../job-form";
import { JobStatusControls } from "../job-status";
import { SharePanel } from "@/components/ui/share-panel";

export const metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermissionPage("jobs:write");
  const { id } = await params;
  const job = await db.jobPost.findUnique({ where: { id }, include: { _count: { select: { clicks: true } } } });
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={job.title} description={`${job.company} · ${job._count.clicks} apply clicks`} />
      <p className="text-sm"><Link href="/admin/jobs" className="text-primary hover:underline">← All jobs</Link></p>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Badge>{job.status}</Badge>
            {job.status === "PUBLISHED" ? (
              <a href={appUrl(`/jobs/${job.slug}`)} target="_blank" rel="noreferrer" className="text-primary hover:underline">View public page ↗</a>
            ) : null}
          </div>
          <JobStatusControls jobId={job.id} status={job.status} />
          {job.status === "PUBLISHED" ? (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Share this job to bring traffic
              </p>
              <SharePanel
                url={appUrl(`/jobs/${job.slug}`)}
                intro="Copy the link or share it straight to WhatsApp/X/LinkedIn."
                shareText={`${job.title} at ${job.company} — apply free on Career Forge:`}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <JobForm
            jobId={job.id}
            initial={{
              title: job.title,
              company: job.company,
              companyLogoUrl: job.companyLogoUrl ?? "",
              location: job.location ?? "",
              locationType: job.locationType,
              type: job.type,
              category: job.category ?? "",
              salaryText: job.salaryText ?? "",
              description: job.description,
              howToApply: job.howToApply ?? "",
              applyUrl: job.applyUrl,
              featured: job.featured,
              expiresAt: job.expiresAt ? job.expiresAt.toISOString().slice(0, 10) : "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
