import Link from "next/link";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { PasteJobPanel } from "./paste-job";

export const metadata = { title: "Jobs" };

const BADGE: Record<string, { label: string; variant: "secondary" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Live", variant: "success" },
  CLOSED: { label: "Closed", variant: "destructive" },
};

export default async function AdminJobsPage() {
  await requirePermissionPage("jobs:write");
  const jobs = await db.jobPost.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { clicks: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs board"
        description="Curated roles for the community. Apply links may be your referral URLs — the public page discloses that."
        action={<Button asChild variant="outline"><Link href="/admin/jobs/new">Fill the form manually</Link></Button>}
      />

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
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
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
