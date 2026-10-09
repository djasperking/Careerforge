import { Bot } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { JobsTabs } from "../jobs-tabs";
import { ClearCrawlerButton } from "./clear-button";

export const metadata = { title: "Old crawler jobs" };

const STATUS: Record<string, { label: string; variant: "secondary" | "success" | "destructive" }> = {
  DRAFT: { label: "Waiting", variant: "secondary" },
  PUBLISHED: { label: "Live", variant: "success" },
  CLOSED: { label: "Closed", variant: "destructive" },
};

export default async function CrawlerJobsPage() {
  await requirePermissionPage("jobs:write");
  const [byStatus, sources, sample] = await Promise.all([
    db.jobPost.groupBy({ by: ["status"], where: { origin: "CRAWLER" }, _count: { _all: true } }),
    db.jobPost.groupBy({ by: ["sourceName"], where: { origin: "CRAWLER" }, _count: { _all: true } }),
    db.jobPost.findMany({
      where: { origin: "CRAWLER" },
      orderBy: [{ status: "desc" }, { createdAt: "desc" }],
      take: 40,
      select: { id: true, title: true, company: true, status: true, sourceName: true, createdAt: true },
    }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  const total = byStatus.reduce((n, b) => n + b._count._all, 0);
  const live = count("PUBLISHED");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs board"
        description="The automatic job crawler has been removed. These are the jobs it brought in before — kept apart from your own and your extension's jobs."
      />
      <JobsTabs active="crawler" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="size-4 text-muted-foreground" /> Clear out the crawler&apos;s jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {total === 0 ? (
            <EmptyState icon={Bot} title="All clear" description="No crawler jobs are left on your site." />
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="success">{live} live on the public board</Badge>
                <Badge variant="secondary">{count("DRAFT")} waiting</Badge>
                <Badge variant="destructive">{count("CLOSED")} closed</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                From: {sources.map((s) => `${s.sourceName ?? "unknown"} (${s._count._all})`).join(", ")}.
                Removing them deletes the jobs for good, including the {live} that visitors can see right now.
                Jobs you posted yourself and jobs from your extension are not touched.
              </p>
              <ClearCrawlerButton total={total} live={live} />
            </>
          )}
        </CardContent>
      </Card>

      {sample.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What&apos;s there{total > sample.length ? ` (newest ${sample.length} of ${total})` : ""}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {sample.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{j.title}</p>
                    <p className="text-xs text-muted-foreground">{j.company} · via {j.sourceName ?? "crawler"} · {formatDate(j.createdAt)}</p>
                  </div>
                  <Badge variant={STATUS[j.status].variant}>{STATUS[j.status].label}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
