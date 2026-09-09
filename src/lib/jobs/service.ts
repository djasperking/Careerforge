import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
  INTERNSHIP: "Internship",
};

export const JOB_LOCATION_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

export async function uniqueJobSlug(title: string, company: string, excludeId?: string) {
  const base = slugify(`${title}-${company}`) || "job";
  let slug = base;
  let n = 1;
  while (await db.jobPost.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Published, non-expired jobs for the public board. */
export async function listPublicJobs(opts: { category?: string; type?: string; location?: string; q?: string } = {}) {
  const now = new Date();
  return db.jobPost.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.type ? { type: opts.type as never } : {}),
      ...(opts.location ? { locationType: opts.location as never } : {}),
      ...(opts.q
        ? {
            OR: [
              { title: { contains: opts.q, mode: "insensitive" } },
              { company: { contains: opts.q, mode: "insensitive" } },
              { description: { contains: opts.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { postedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

/**
 * Jobs for the shareable "Jobs today" page: everything published in the last
 * `days` days (default 7). Falls back to the newest `min` jobs if that window
 * is empty, so the page is never bare.
 */
export async function listRecentJobs(opts: { days?: number; min?: number } = {}) {
  const days = opts.days ?? 7;
  const min = opts.min ?? 8;
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);

  const base = {
    status: "PUBLISHED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };

  const recent = await db.jobPost.findMany({
    where: { ...base, postedAt: { gte: since } },
    orderBy: [{ featured: "desc" }, { postedAt: "desc" }],
    take: 40,
  });
  if (recent.length >= 3) return recent;

  return db.jobPost.findMany({
    where: base,
    orderBy: [{ featured: "desc" }, { postedAt: "desc" }, { createdAt: "desc" }],
    take: min,
  });
}

export async function listJobCategories() {
  const rows = await db.jobPost.findMany({
    where: { status: "PUBLISHED", category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  return rows.map((r) => r.category!).filter(Boolean).sort();
}

export async function recordApplyClick(jobId: string, userId: string | null, ip: string | null) {
  await db.jobApplyClick.create({ data: { jobId, userId, ip } }).catch(() => {});
}
