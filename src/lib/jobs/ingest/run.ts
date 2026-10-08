import { db } from "@/lib/db";
import { uniqueJobSlug } from "@/lib/jobs/service";
import type { JobSource } from "@prisma/client";
import { fetchSource } from "./adapters";
import type { NormalizedJob, SourceConfig } from "./types";

/** Never flood the review queue from one source in one run. */
const MAX_NEW_PER_RUN = 100;
/** Ignore listings older than this (when the source tells us the date). */
const MAX_AGE_DAYS = 45;
/** Stop starting new sources after this long (serverless time limit). */
const RUN_BUDGET_MS = 45_000;

const clip = (s: string | undefined, n: number) => (s ?? "").trim().slice(0, n);

function usable(j: NormalizedJob): boolean {
  if (!j.externalId || j.title.length < 3 || j.company.length < 2) return false;
  // This board is for remote work: skip on-site and hybrid roles.
  if (j.locationType !== "REMOTE") return false;
  if (!/^https?:\/\//i.test(j.applyUrl)) return false;
  if (j.postedAt && !Number.isNaN(+j.postedAt) && Date.now() - +j.postedAt > MAX_AGE_DAYS * 86_400_000) return false;
  return true;
}

export interface SourceRunResult {
  sourceId: string;
  name: string;
  found: number;
  created: number;
  closed: number;
  error?: string;
}

/** Pull one source: add new jobs as DRAFTs, refresh known ones, close vanished ones. */
export async function runSource(source: JobSource): Promise<SourceRunResult> {
  const startedAt = new Date();
  const result: SourceRunResult = { sourceId: source.id, name: source.name, found: 0, created: 0, closed: 0 };

  try {
    const { jobs, error } = await fetchSource(source.type, (source.config ?? {}) as SourceConfig);
    if (error) throw new Error(error);

    // Optional per-source topic filter, e.g. "annotator, rater" for AI-trainer boards.
    const cfg = (source.config ?? {}) as Record<string, unknown>;
    const keywords =
      typeof cfg.keywords === "string"
        ? cfg.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean)
        : [];
    const onTopic = (j: NormalizedJob) =>
      keywords.length === 0 || keywords.some((k) => `${j.title} ${j.category ?? ""}`.toLowerCase().includes(k));

    const valid = jobs.filter((j) => usable(j) && onTopic(j));
    result.found = valid.length;

    for (const j of valid) {
      const existing = await db.jobPost.findUnique({
        where: { sourceId_externalId: { sourceId: source.id, externalId: j.externalId } },
        select: { id: true },
      });
      if (existing) {
        await db.jobPost.update({ where: { id: existing.id }, data: { lastSeenAt: startedAt } });
        continue;
      }
      if (result.created >= MAX_NEW_PER_RUN) continue;

      // Same apply link already on the site (hand-posted or from another source).
      const dup = await db.jobPost.findFirst({ where: { applyUrl: j.applyUrl }, select: { id: true } });
      if (dup) continue;

      const description = clip(j.description, 18_000) || `${j.title} at ${j.company}. See the full role and apply on the employer's page.`;
      await db.jobPost.create({
        data: {
          slug: await uniqueJobSlug(clip(j.title, 160), clip(j.company, 160)),
          title: clip(j.title, 160),
          company: clip(j.company, 160),
          location: clip(j.location, 160) || null,
          locationType: j.locationType,
          type: j.type,
          category: clip(j.category, 80) || null,
          salaryText: clip(j.salaryText, 120) || null,
          description,
          applyUrl: j.applyUrl,
          status: "DRAFT",
          sourceId: source.id,
          externalId: j.externalId,
          sourceName: source.name,
          lastSeenAt: startedAt,
        },
      });
      result.created++;
    }

    // Anything this source used to list but didn't this time has been filled
    // or withdrawn. Only trust that when the source actually returned jobs.
    if (valid.length > 0) {
      const closed = await db.jobPost.updateMany({
        where: {
          sourceId: source.id,
          status: { in: ["PUBLISHED", "DRAFT"] },
          OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: startedAt } }],
        },
        data: { status: "CLOSED" },
      });
      result.closed = closed.count;
    }

    await db.jobSource.update({
      where: { id: source.id },
      data: { lastRunAt: new Date(), lastRunStatus: "ok", lastRunFound: result.found, lastRunNew: result.created },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.error = message;
    console.error(`job ingest: ${source.name} failed`, err);
    await db.jobSource.update({
      where: { id: source.id },
      data: { lastRunAt: new Date(), lastRunStatus: message.slice(0, 300), lastRunFound: 0, lastRunNew: 0 },
    });
  }
  return result;
}

/** Run every enabled source, least-recently-run first, within a time budget. */
export async function runAllSources(): Promise<SourceRunResult[]> {
  const started = Date.now();
  const sources = await db.jobSource.findMany({
    // Browser clips are pushed by the extension, never pulled.
    where: { enabled: true, type: { not: "BROWSER_CLIP" } },
    orderBy: [{ lastRunAt: { sort: "asc", nulls: "first" } }],
  });
  const results: SourceRunResult[] = [];
  for (const s of sources) {
    if (Date.now() - started > RUN_BUDGET_MS) break;
    results.push(await runSource(s));
  }
  return results;
}
