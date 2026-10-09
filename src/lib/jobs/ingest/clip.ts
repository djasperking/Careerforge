import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { withAIUsage } from "@/lib/ai";
import { heuristicParseJob } from "@/lib/jobs/parse-posting";
import { uniqueJobSlug } from "@/lib/jobs/service";
import type { JobImportOutput } from "@/lib/ai/types";
import type { JobLocationType, JobType } from "@prisma/client";
import { htmlToText, inferJobType, inferLocationType } from "./text";
import { isGenericTitle, looksLikeSingleJob } from "./clip-guard";

export interface ClipInput {
  url: string;
  title?: string;
  text?: string;
  /** Parsed <script type="application/ld+json"> blocks from the page. */
  jsonLd?: unknown[];
  /** Label shown as "via …" (defaults to the page's hostname). */
  via?: string;
}

export type ClipResult =
  | { status: "created"; id: string; title: string; company: string }
  | { status: "duplicate"; id: string; title: string };

/**
 * Members-only pages (e.g. a logged-in marketplace) are clipped as an excerpt
 * only; the full role stays on the original page, which the listing links to.
 */
const MAX_DESCRIPTION = 2500;

const TRACKING = /^(utm_|fbclid|gclid|mc_|ref$|ref_|source$|trk|_hs)/i;

/** Same job, same URL — ignore the fragment and tracking parameters. */
export function normalizeJobUrl(raw: string): string {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only http(s) links can be clipped.");
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
  u.searchParams.sort();
  return u.toString();
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function findJobPosting(blocks: unknown[] | undefined): Record<string, any> | null {
  const stack: unknown[] = [...(blocks ?? [])];
  while (stack.length) {
    const n = stack.pop() as any;
    if (!n || typeof n !== "object") continue;
    if (Array.isArray(n)) { stack.push(...n); continue; }
    const t = n["@type"];
    if (t === "JobPosting" || (Array.isArray(t) && t.includes("JobPosting"))) return n;
    if (n["@graph"]) stack.push(n["@graph"]);
  }
  return null;
}

function fromJsonLd(j: Record<string, any>): JobImportOutput {
  const loc = Array.isArray(j.jobLocation) ? j.jobLocation[0] : j.jobLocation;
  const addr = loc?.address ?? {};
  const place = [addr.addressLocality, addr.addressRegion, addr.addressCountry?.name ?? addr.addressCountry]
    .map(str).filter(Boolean).join(", ");
  const remote = str(j.jobLocationType).toUpperCase() === "TELECOMMUTE";
  const sal = j.baseSalary?.value ?? {};
  const cur = str(j.baseSalary?.currency);
  const salaryText = sal.minValue
    ? `${cur} ${sal.minValue}${sal.maxValue ? `–${sal.maxValue}` : "+"}${sal.unitText ? ` / ${String(sal.unitText).toLowerCase()}` : ""}`.trim()
    : str(sal.value) ? `${cur} ${sal.value}`.trim() : "";
  const emp = Array.isArray(j.employmentType) ? j.employmentType.join(" ") : str(j.employmentType);
  return {
    title: str(j.title),
    company: str(j.hiringOrganization?.name),
    location: remote ? place || "Remote" : place,
    locationType: remote ? "REMOTE" : inferLocationType(`${place} ${j.title}`),
    type: inferJobType(emp.replace(/_/g, " ")),
    category: str(j.industry) || "",
    salaryText,
    description: htmlToText(str(j.description)),
  } as JobImportOutput;
}

const LOCATION_TYPES: JobLocationType[] = ["REMOTE", "HYBRID", "ONSITE"];
const JOB_TYPES: JobType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"];

/** How long a clip waits for the AI before using the quick local parser. */
const AI_PATIENCE_MS = 20_000;

async function parseText(text: string): Promise<JobImportOutput> {
  const ctx = { feature: "job.import" };
  const ai = withAIUsage(ctx, (p) => p.importJobPosting({ rawText: text.slice(0, 18_000) }, ctx))
    .then((r) => r.data)
    .catch((err) => {
      console.error("job clip: AI parse failed", err);
      return null;
    });
  const waited = new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_PATIENCE_MS));
  // A clip is a click in the browser — don't make the user wait on a slow AI.
  return (await Promise.race([ai, waited])) ?? heuristicParseJob(text);
}

export async function ensureClipSource() {
  const existing = await db.jobSource.findFirst({ where: { type: "BROWSER_CLIP" } });
  return existing ?? db.jobSource.create({ data: { type: "BROWSER_CLIP", name: "Browser clips", config: {} } });
}

export async function ingestClip(input: ClipInput): Promise<ClipResult> {
  const applyUrl = normalizeJobUrl(input.url);

  // Already on the site (clipped before, imported by an agent, or hand-posted)?
  const dup = await db.jobPost.findFirst({ where: { applyUrl }, select: { id: true, title: true, sourceId: true } });
  if (dup) {
    if (dup.sourceId) await db.jobPost.update({ where: { id: dup.id }, data: { lastSeenAt: new Date() } });
    return { status: "duplicate", id: dup.id, title: dup.title };
  }

  const ld = findJobPosting(input.jsonLd);
  if (!looksLikeSingleJob({ url: applyUrl, text: input.text ?? "", hasStructuredData: !!ld })) {
    throw new Error("That doesn't look like a single job page. Open one specific job and try again.");
  }
  const parsed = ld ? fromJsonLd(ld) : await parseText(input.text ?? "");

  const host = new URL(applyUrl).hostname.replace(/^(www|work|jobs|careers)\./, "");
  const via = (input.via ?? "").trim().slice(0, 60) || host;
  const title = (str(parsed.title) || str(input.title)).slice(0, 160);
  const company = (str(parsed.company) || via).slice(0, 160);
  if (title.length < 3) throw new Error("Couldn't find a job title on that page.");
  if (isGenericTitle(title)) throw new Error("That page is a heading or landing page, not a job. Open one specific job and try again.");

  // Same role clipped from a different URL (e.g. a tracking variant).
  const dupe2 = await db.jobPost.findFirst({
    where: { title: { equals: title, mode: "insensitive" }, company: { equals: company, mode: "insensitive" } },
    select: { id: true, title: true },
  });
  if (dupe2) return { status: "duplicate", id: dupe2.id, title: dupe2.title };

  let body = str(parsed.description);
  if (body.length > MAX_DESCRIPTION) body = body.slice(0, MAX_DESCRIPTION).replace(/\s+\S*$/, "") + "…";
  const description = `${body || `${title} at ${company}.`}\n\nThis is an excerpt. See the full role and apply on ${via}.`;

  const source = await ensureClipSource();
  const job = await db.jobPost.create({
    data: {
      slug: await uniqueJobSlug(title, company),
      title,
      company,
      location: str(parsed.location).slice(0, 160) || null,
      locationType: LOCATION_TYPES.includes(parsed.locationType as JobLocationType) ? (parsed.locationType as JobLocationType) : "REMOTE",
      type: JOB_TYPES.includes(parsed.type as JobType) ? (parsed.type as JobType) : "FULL_TIME",
      category: str(parsed.category).slice(0, 80) || null,
      salaryText: str(parsed.salaryText).slice(0, 120) || null,
      description,
      applyUrl,
      status: "DRAFT",
      origin: "CLIP",
      sourceId: source.id,
      externalId: createHash("sha1").update(applyUrl).digest("hex").slice(0, 24),
      sourceName: via,
      lastSeenAt: new Date(),
    },
  });
  return { status: "created", id: job.id, title: job.title, company: job.company };
}
