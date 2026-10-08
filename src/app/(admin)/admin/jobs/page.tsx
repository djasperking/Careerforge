import Link from "next/link";
import { Bot } from "lucide-react";
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

export const metadata = { title: "Jobs" };

const BADGE: Record<string, { label: string; variant: "secondary" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Live", variant: "success" },
  CLOSED: { label: "Closed", variant: "destructive" },
};

type Row = {
  id: string;
  slug: string;
  title: string;
  company: string;
  status: string;
  featured: boolean;
  createdAt: Date;
  sourceName: string | null;
  sourceId: string | null;
  _count: { clicks: number };
};

function JobRow({ j }: { j: Row }) {
  const b = BADGE[j.status];
  const fromAgent = !!j.sourceId;
  return (
    <li className={`flex items-center justify-between gap-3 p-4 ${fromAgent ? "bg-primary/5" : ""}`}>
      <div className="min-w-0">
        <Link href={`/admin/jobs/${j.id}`} className="font-medium hover:underline">{j.title}</Link>
        <p className="text-xs text-muted-foreground">
          {j.company} · {j._count.clicks} apply clicks · {formatDate(j.createdAt)}
          {j.sourceName ? ` · via ${j.sourceName}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {j.status === "PUBLISHED" ? <CopyLinkButton url={appUrl(`/jobs/${j.slug}`)} /> : null}
        {j.featured ? <Badge variant="secondary">Featured</Badge> : null}
        {fromAgent ? (
          <Badge className="gap-1"><Bot className="size-3" /> Agent</Badge>
        ) : null}
        <Badge variant={b.variant}>{b.label}</Badge>
      </div>
    </li>
  );
}

export default async function AdminJobsPage() {
  await requirePermissionPage("jobs:write");
  const rowSelect = {
    id: true, slug: true, title: true, company: true, status: true, featured: true,
    createdAt: true, sourceName: true, sourceId: true,
    _count: { select: { clicks: true } },
  } as const;

  const [mine, agentLive, agentDrafts, pendingReview] = await Promise.all([
    db.jobPost.findMany({
      where: { sourceId: null },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: rowSelect,
    }),
    db.jobPost.findMany({
      where: { sourceId: { not: null }, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: rowSelect,
    }),
    db.jobPost.findMany({
      where: { sourceId: { not: null }, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: rowSelect,
    }),
    db.jobPost.count({ where: { status: "DRAFT", sourceId: { not: null } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs board"
        description="Jobs found by the job agent are shaded and tagged “Agent” and kept in their own sections, apart from the jobs you post yourself."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/admin/jobs/sources">Job sources</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/jobs/new">Fill the form manually</Link></Button>
          </div>
        }
      />

      <Card className="border-primary/40">
        <CardHeader className="flex-row items-center justify-between gap-3 bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-4 text-primary" /> Found by the job agent — waiting for review
            <Badge>{pendingReview}</Badge>
          </CardTitle>
          {pendingReview > 0 ? (
            <Link href="/admin/jobs/review" className="text-sm font-medium text-primary hover:underline">
              Review all {pendingReview} →
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {agentDrafts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nothing waiting. New roles from your <Link href="/admin/jobs/sources" className="text-primary hover:underline">sources</Link> appear here after each daily run.
            </p>
          ) : (
            <>
              <ul className="divide-y">
                {agentDrafts.map((j) => <JobRow key={j.id} j={j} />)}
              </ul>
              {pendingReview > agentDrafts.length ? (
                <p className="border-t p-3 text-center text-xs text-muted-foreground">
                  Showing the newest {agentDrafts.length} of {pendingReview}.{" "}
                  <Link href="/admin/jobs/review" className="text-primary hover:underline">Open the review page</Link>
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <PasteJobPanel />

      {agentLive.length > 0 ? (
        <Card className="border-primary/40">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4 text-primary" /> Live jobs from the agent <Badge variant="secondary">{agentLive.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {agentLive.map((j) => <JobRow key={j.id} j={j} />)}
            </ul>
          </CardContent>
        </Card>
      ) : null}

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
              {mine.map((j) => <JobRow key={j.id} j={j} />)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
