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

export interface PublicJobFilters {
  category?: string;
  type?: string;
  location?: string; // JobLocationType: REMOTE | HYBRID | ONSITE
  q?: string;
}

/** WHERE clause for the public board: live, not expired, plus any filters. */
function publicWhere(opts: PublicJobFilters) {
  const now = new Date();
  const and: object[] = [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }];
  // Search is its own AND clause so it can't replace the expiry check above.
  if (opts.q) {
    and.push({
      OR: [
        { title: { contains: opts.q, mode: "insensitive" } },
        { company: { contains: opts.q, mode: "insensitive" } },
        { description: { contains: opts.q, mode: "insensitive" } },
      ],
    });
  }
  return {
    status: "PUBLISHED" as const,
    AND: and,
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.type ? { type: opts.type as never } : {}),
    ...(opts.location ? { locationType: opts.location as never } : {}),
  };
}

const PUBLIC_ORDER = [{ featured: "desc" as const }, { postedAt: "desc" as const }, { createdAt: "desc" as const }];

/** Published, non-expired jobs (first 100) — for the homepage, matching and the newsletter. */
export async function listPublicJobs(opts: PublicJobFilters = {}) {
  return db.jobPost.findMany({ where: publicWhere(opts), orderBy: PUBLIC_ORDER, take: 100 });
}

export const JOBS_PER_PAGE = 20;

/** One page of the public board, with the total so the UI can paginate. */
export async function searchPublicJobs(opts: PublicJobFilters & { page?: number } = {}) {
  const where = publicWhere(opts);
  const total = await db.jobPost.count({ where });
  const pages = Math.max(1, Math.ceil(total / JOBS_PER_PAGE));
  const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1) || 1), pages);
  const jobs = await db.jobPost.findMany({
    where,
    orderBy: PUBLIC_ORDER,
    skip: (page - 1) * JOBS_PER_PAGE,
    take: JOBS_PER_PAGE,
  });
  return { jobs, total, page, pages };
}

/** Headline numbers for the top of the board. */
export async function jobBoardStats() {
  const base = publicWhere({});
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [total, remote, thisWeek] = await Promise.all([
    db.jobPost.count({ where: base }),
    db.jobPost.count({ where: { ...base, locationType: "REMOTE" } }),
    db.jobPost.count({ where: { ...base, OR: [{ postedAt: { gte: weekAgo } }, { postedAt: null, createdAt: { gte: weekAgo } }] } }),
  ]);
  return { total, remote, thisWeek };
}

/** Similar live jobs for the bottom of a job page: same category first, then same company. */
export async function listSimilarJobs(job: { id: string; category: string | null; company: string }, take = 3) {
  const where = publicWhere({});
  const sameCategory = job.category
    ? await db.jobPost.findMany({ where: { ...where, category: job.category, NOT: { id: job.id } }, orderBy: PUBLIC_ORDER, take })
    : [];
  if (sameCategory.length >= take) return sameCategory;
  const more = await db.jobPost.findMany({
    where: { ...where, NOT: { id: { in: [job.id, ...sameCategory.map((j) => j.id)] } } },
    orderBy: PUBLIC_ORDER,
    take: take - sameCategory.length,
  });
  return [...sameCategory, ...more];
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
  const rows = await db.jobPost.groupBy({
    by: ["category"],
    where: publicWhere({}) as never,
    _count: { _all: true },
  });
  return rows
    .filter((r) => r.category && r.category.trim())
    .sort((a, b) => b._count._all - a._count._all || String(a.category).localeCompare(String(b.category)))
    .map((r) => ({ name: r.category as string, count: r._count._all }));
}

export async function recordApplyClick(jobId: string, userId: string | null, ip: string | null) {
  await db.jobApplyClick.create({ data: { jobId, userId, ip } }).catch(() => {});
}
