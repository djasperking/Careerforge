import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CompanyMark } from "@/components/jobs/company-mark";
import { isNewJob, postedAgo, shortPay } from "@/lib/jobs/format";
import { JOB_LOCATION_LABELS, JOB_TYPE_LABELS } from "@/lib/jobs/service";
import { cn } from "@/lib/utils";

export interface JobCardData {
  slug: string;
  title: string;
  company: string;
  companyLogoUrl: string | null;
  location: string | null;
  locationType: string;
  type: string;
  category: string | null;
  salaryText: string | null;
  featured: boolean;
  postedAt: Date | null;
  createdAt: Date;
}

/** One consistent row for every job on the public board. */
export function JobCard({ job, suited = false }: { job: JobCardData; suited?: boolean }) {
  const when = job.postedAt ?? job.createdAt;
  const pay = shortPay(job.salaryText);
  const remote = job.locationType === "REMOTE";
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className={cn(
        "group flex gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 sm:p-5",
        job.featured && "border-primary/40 bg-primary/[0.03]",
      )}
    >
      <CompanyMark name={job.company} logoUrl={job.companyLogoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-base font-semibold leading-snug group-hover:text-primary">{job.title}</h2>
          {job.featured ? <Badge>Featured</Badge> : null}
          {isNewJob(when) ? <Badge variant="success">New</Badge> : null}
          {suited ? <Badge variant="secondary">Suited to you</Badge> : null}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {job.company}
          {job.location ? <span> · {job.location}</span> : null}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium",
              remote ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            <span className={cn("size-1.5 rounded-full", remote ? "bg-success" : "bg-muted-foreground/60")} />
            {JOB_LOCATION_LABELS[job.locationType] ?? job.locationType}
          </span>
          <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">{JOB_TYPE_LABELS[job.type] ?? job.type}</span>
          {pay ? <span className="rounded-md bg-primary/10 px-2 py-1 font-medium text-primary">{pay}</span> : null}
          {job.category ? <span className="hidden text-muted-foreground sm:inline">{job.category}</span> : null}
        </div>
      </div>
      <span className="hidden shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:block">{postedAgo(when)}</span>
    </Link>
  );
}
