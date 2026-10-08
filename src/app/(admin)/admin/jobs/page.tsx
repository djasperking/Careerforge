import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { appUrl } from "@/lib/email";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { PasteJobPanel } from "./paste-job";

export const metadata = { title: "Jobs" };

const BADGE: Record<string, { label: string; variant: "secondary" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Live", variant: "success" },
  CLOSED: { label: "Closed", variant: "destructive" },
};

export default async function AdminJobsPage() {
  await requirePermissionPage("jobs:write");
  // Imported drafts live on the review page, and closed imports are noise —
  // this list is hand-posted jobs plus anything imported that is now live.
  const [jobs, pendingReview] = await Promise.all([
    db.jobPost.findMany({
      where: { OR: [{ sourceId: null }, { status: "PUBLISHED" }] },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { clicks: true } } },
    }),
    db.jobPost.count({ where: { status: "DRAFT", sourceId: { not: null } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs board"
        description="Curated roles for the community. Copy a job's link straight from its row to share it and drive traffic."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/admin/jobs/sources">Job sources</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/jobs/new">Fill the form manually</Link></Button>
          </div>
        }
      />

      {pendingReview > 0 ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              <span className="font-medium">{pendingReview}</span> job{pendingReview === 1 ? "" : "s"} found by the job agent{" "}
              {pendingReview === 1 ? "is" : "are"} waiting for your review.
            </p>
            <Link href="/admin/jobs/review" className="text-sm font-medium text-primary hover:underline">Review them →</Link>
          </CardContent>
        </Card>
      ) : null}

      <PasteJobPanel />

      <Card>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No jobs yet. <Link href="/admin/jobs/new" className="text-primary hover:underline">Post the first one.</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {jobs.map((j) => {
                const b = BADGE[j.status];
                return (
                  <li key={j.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Link href={`/admin/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
                      <p className="text-xs text-muted-foreground">
                        {j.company} · {j._count.clicks} apply clicks · {formatDate(j.createdAt)}
                        {j.sourceName ? ` · via ${j.sourceName}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {j.status === "PUBLISHED" ? (
                        <CopyLinkButton url={appUrl(`/jobs/${j.slug}`)} />
                      ) : null}
                      {j.featured ? <Badge variant="secondary">Featured</Badge> : null}
                      <Badge variant={b.variant}>{b.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
