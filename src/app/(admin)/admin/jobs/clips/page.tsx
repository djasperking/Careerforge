import Link from "next/link";
import { Puzzle } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { postedAgo } from "@/lib/jobs/format";
import { appUrl } from "@/lib/email";
import { JobsTabs } from "../jobs-tabs";
import { ClipList, type ClipRow } from "./clip-list";

export const metadata = { title: "Jobs from your extension" };

function toRow(j: {
  id: string; slug: string; title: string; company: string; location: string | null; locationType: string;
  salaryText: string | null; sourceName: string | null; applyUrl: string; createdAt: Date; description: string;
}): ClipRow {
  return {
    id: j.id,
    slug: j.slug,
    title: j.title,
    company: j.company,
    location: j.location,
    locationType: j.locationType,
    salaryText: j.salaryText,
    sourceName: j.sourceName,
    applyUrl: j.applyUrl,
    clippedAgo: postedAgo(j.createdAt),
    excerpt: j.description,
    liveUrl: `/jobs/${j.slug}`,
    shareUrl: appUrl(`/jobs/${j.slug}`),
  };
}

export default async function ClippedJobsPage() {
  await requirePermissionPage("jobs:write");
  const select = {
    id: true, slug: true, title: true, company: true, location: true, locationType: true,
    salaryText: true, sourceName: true, applyUrl: true, createdAt: true, description: true,
  } as const;
  const [waiting, live] = await Promise.all([
    db.jobPost.findMany({ where: { origin: "CLIP", status: "DRAFT" }, orderBy: { createdAt: "desc" }, select }),
    db.jobPost.findMany({ where: { origin: "CLIP", status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, select }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs board"
        description="Everything you send from the browser extension lands here, on its own — apart from the jobs you post yourself."
      />
      <JobsTabs active="clips" />

      <Card className="border-primary/40">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="size-4 text-primary" /> Waiting to publish <Badge>{waiting.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {waiting.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Puzzle}
                title="Nothing waiting"
                description="Open a job page, click the Career Forge Job Clipper button in Chrome, and it shows up here to publish in one click."
              />
            </div>
          ) : (
            <ClipList jobs={waiting.map(toRow)} mode="waiting" />
          )}
        </CardContent>
      </Card>

      {live.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Published from the extension <Badge variant="success">{live.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ClipList jobs={live.map(toRow)} mode="live" />
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">
        The extension is in <code>extensions/job-clipper</code>. It only accepts pages that look like one specific job — not job lists or
        marketing pages.{" "}
        <Link href="/admin/jobs" className="text-primary hover:underline">Back to your own jobs</Link>
      </p>
    </div>
  );
}
