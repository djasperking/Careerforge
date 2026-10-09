import Link from "next/link";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type Tab = "mine" | "clips" | "crawler";

/** Tab bar that keeps the three kinds of jobs in clearly separate views. */
export async function JobsTabs({ active }: { active: Tab }) {
  const [mine, clipsWaiting, clipsLive, crawler] = await Promise.all([
    db.jobPost.count({ where: { origin: "MANUAL" } }),
    db.jobPost.count({ where: { origin: "CLIP", status: "DRAFT" } }),
    db.jobPost.count({ where: { origin: "CLIP", status: "PUBLISHED" } }),
    db.jobPost.count({ where: { origin: "CRAWLER" } }),
  ]);

  const tabs: { id: Tab; label: string; href: string; count: number; highlight?: boolean }[] = [
    { id: "mine", label: "Jobs you posted", href: "/admin/jobs", count: mine },
    { id: "clips", label: "From your extension", href: "/admin/jobs/clips", count: clipsWaiting + clipsLive, highlight: clipsWaiting > 0 },
  ];
  // The crawler has been removed — this tab only exists while old crawler jobs remain to be cleared.
  if (crawler > 0 || active === "crawler") {
    tabs.push({ id: "crawler", label: "Old crawler jobs", href: "/admin/jobs/crawler", count: crawler });
  }

  return (
    <div className="flex flex-wrap gap-1 border-b">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={cn(
            "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
            active === t.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              t.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {t.count}
          </span>
        </Link>
      ))}
    </div>
  );
}
