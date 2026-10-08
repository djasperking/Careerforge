import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewList } from "./review-list";

export const metadata = { title: "Review imported jobs" };

export default async function ReviewImportedJobsPage() {
  await requirePermissionPage("jobs:write");
  const jobs = await db.jobPost.findMany({
    where: { status: "DRAFT", sourceId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true, title: true, company: true, location: true, locationType: true,
      sourceName: true, applyUrl: true, salaryText: true, description: true,
    },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/jobs/sources" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Job sources
      </Link>
      <PageHeader
        title="Review imported jobs"
        description="Found by the job agent. Nothing goes live until you publish it — open the original to sanity-check anything that looks off."
      />
      {jobs.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing waiting" description="New roles from your sources will show up here after the next run." />
      ) : (
        <ReviewList
          jobs={jobs.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location,
            locationType: j.locationType,
            sourceName: j.sourceName,
            applyUrl: j.applyUrl,
            salaryText: j.salaryText,
            snippet: j.description.replace(/\s+/g, " ").slice(0, 220),
          }))}
        />
      )}
    </div>
  );
}
