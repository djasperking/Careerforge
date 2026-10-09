import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { appUrl } from "@/lib/email";
import { CopyLinkButton } from "@/components/ui/copy-link-button";
import { PasteJobPanel } from "./paste-job";
import { JobsTabs } from "./jobs-tabs";

export const metadata = { title: "Jobs" };

const BADGE: Record<string, { label: string; variant: "secondary" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Live", variant: "success" },
  CLOSED: { label: "Closed", variant: "destructive" },
};

export default async function AdminJobsPage() {
  await requirePermissionPage("jobs:write");
  // Only jobs you posted yourself. Extension jobs and old crawler jobs have their own tabs.
  const mine = await db.jobPost.findMany({
    where: { origin: "MANUAL" },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { clicks: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs board"
        description="Jobs you post yourself. Jobs from your browser extension have their own tab."
        action={<Button asChild variant="outline"><Link href="/admin/jobs/new">Fill the form manually</Link></Button>}
      />
      <JobsTabs active="mine" />

      <PasteJobPanel />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Jobs you posted <Badge variant="secondary">{mine.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {mine.length === 0 ? (
            <p className="px-4 pb-6 text-sm text-muted-foreground">
              No jobs yet. <Link href="/admin/jobs/new" className="text-primary hover:underline">Post the first one.</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {mine.map((j) => {
                const b = BADGE[j.status];
                return (
                  <li key={j.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Link href={`/admin/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
                      <p className="text-xs text-muted-foreground">
                        {j.company} · {j._count.clicks} apply clicks · {formatDate(j.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {j.status === "PUBLISHED" ? <CopyLinkButton url={appUrl(`/jobs/${j.slug}`)} /> : null}
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
