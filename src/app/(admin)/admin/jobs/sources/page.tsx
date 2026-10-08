import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { SOURCE_TYPES } from "@/lib/jobs/ingest/source-types";
import { AddSourceForm, RunAllButton, SourceActions } from "./source-controls";

export const metadata = { title: "Job sources" };

// "Run" fetches and imports from the source inside this page's server action.
export const maxDuration = 60;

export default async function JobSourcesPage() {
  await requirePermissionPage("jobs:write");
  const [sources, pendingReview] = await Promise.all([
    db.jobSource.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { jobs: true } } } }),
    db.jobPost.count({ where: { status: "DRAFT", sourceId: { not: null } } }),
  ]);
  const label = (t: string) => SOURCE_TYPES.find((x) => x.type === t)?.label ?? t;

  return (
    <div className="space-y-6">
      <Link href="/admin/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Jobs board
      </Link>
      <PageHeader
        title="Job sources"
        description="The job agent reads these every day and adds new roles as drafts for you to review. Each listing shows “via [source]” and sends people to the employer's own apply page."
        action={<RunAllButton />}
      />

      {pendingReview > 0 ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              <span className="font-medium">{pendingReview}</span> imported job{pendingReview === 1 ? "" : "s"} waiting for your review.
            </p>
            <Link href="/admin/jobs/review" className="text-sm font-medium text-primary hover:underline">Review them →</Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Sources</CardTitle></CardHeader>
        <CardContent className="p-0">
          {sources.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No sources yet — add one below.</p>
          ) : (
            <ul className="divide-y">
              {sources.map((s) => {
                const cfg = (s.config ?? {}) as Record<string, string>;
                const detail = cfg.board || cfg.country || cfg.keywords || cfg.feed || "";
                return (
                  <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        {s.name}
                        {!s.enabled ? <Badge variant="secondary">Paused</Badge> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {label(s.type)}{detail ? ` · ${detail}` : ""} · {s._count.jobs} jobs imported
                      </p>
                      <p className={`mt-1 text-xs ${s.lastRunAt && s.lastRunStatus !== "ok" ? "text-destructive" : "text-muted-foreground"}`}>
                        {s.lastRunAt
                          ? s.lastRunStatus === "ok"
                            ? `Last run ${formatDate(s.lastRunAt)} — ${s.lastRunFound} found, ${s.lastRunNew} new`
                            : `Last run ${formatDate(s.lastRunAt)} failed: ${s.lastRunStatus}`
                          : "Not run yet"}
                      </p>
                    </div>
                    <SourceActions id={s.id} enabled={s.enabled} />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add a source</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Company boards use the name in the company&apos;s careers link — e.g. <code>boards.greenhouse.io/<b>stripe</b></code>,{" "}
            <code>jobs.lever.co/<b>palantir</b></code>, <code>jobs.ashbyhq.com/<b>ashby</b></code>.
          </p>
          <AddSourceForm />
        </CardContent>
      </Card>
    </div>
  );
}
