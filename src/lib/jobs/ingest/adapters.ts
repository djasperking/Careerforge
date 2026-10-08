import { env } from "@/lib/env";
import type { JobSourceType } from "@prisma/client";
import type { AdapterResult, NormalizedJob, SourceConfig } from "./types";
import { decodeEntities, getJson, htmlToText, inferJobType, inferLocationType } from "./text";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// ---- Company job boards (public, built to be embedded/aggregated) ----------

async function greenhouse(cfg: SourceConfig): Promise<AdapterResult> {
  const board = str(cfg.board);
  if (!board) return { jobs: [], error: "Set the Greenhouse board name (e.g. “stripe”)." };
  const data = await getJson<{ jobs: Record<string, any>[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`,
  );
  const company = str(cfg.company) || board;
  return {
    jobs: data.jobs.map((j) => {
      const loc = str(j.location?.name);
      return {
        externalId: String(j.id),
        title: str(j.title),
        company: str(j.company_name) || company,
        location: loc,
        locationType: inferLocationType(`${loc} ${j.title}`),
        type: inferJobType(str(j.title)),
        category: str(j.departments?.[0]?.name).replace(/^\d+\s+/, "") || undefined,
        description: htmlToText(str(j.content)),
        applyUrl: str(j.absolute_url),
        postedAt: j.first_published ? new Date(j.first_published) : undefined,
      } satisfies NormalizedJob;
    }),
  };
}

async function lever(cfg: SourceConfig): Promise<AdapterResult> {
  const slug = str(cfg.board);
  if (!slug) return { jobs: [], error: "Set the Lever company name (e.g. “palantir”)." };
  const data = await getJson<Record<string, any>[]>(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
  const company = str(cfg.company) || slug;
  return {
    jobs: data.map((j) => {
      const loc = str(j.categories?.location);
      const wp = str(j.workplaceType).toLowerCase();
      return {
        externalId: String(j.id),
        title: str(j.text),
        company,
        location: loc,
        locationType:
          wp === "remote" ? "REMOTE" : wp === "hybrid" ? "HYBRID" : wp === "on-site" ? "ONSITE" : inferLocationType(`${loc} ${j.text}`),
        type: inferJobType(`${str(j.categories?.commitment)} ${j.text}`),
        category: str(j.categories?.team) || undefined,
        description: str(j.descriptionPlain) + (j.additionalPlain ? `\n\n${str(j.additionalPlain)}` : ""),
        applyUrl: str(j.hostedUrl),
        postedAt: j.createdAt ? new Date(j.createdAt) : undefined,
      } satisfies NormalizedJob;
    }),
  };
}

async function ashby(cfg: SourceConfig): Promise<AdapterResult> {
  const board = str(cfg.board);
  if (!board) return { jobs: [], error: "Set the Ashby board name (e.g. “ashby”)." };
  const data = await getJson<{ jobs: Record<string, any>[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`,
  );
  const company = str(cfg.company) || board;
  return {
    jobs: data.jobs
      .filter((j) => j.isListed !== false)
      .map((j) => {
        const loc = str(j.location);
        const wp = str(j.workplaceType).toLowerCase();
        return {
          externalId: String(j.id),
          title: str(j.title),
          company,
          location: loc,
          locationType: j.isRemote ? "REMOTE" : wp === "hybrid" ? "HYBRID" : inferLocationType(`${loc} ${j.title}`),
          type: inferJobType(str(j.employmentType).replace(/([a-z])([A-Z])/g, "$1 $2")),
          category: str(j.department) || str(j.team) || undefined,
          salaryText: str(j.compensation?.compensationTierSummary) || undefined,
          description: str(j.descriptionPlain),
          applyUrl: str(j.jobUrl) || str(j.applyUrl),
          postedAt: j.publishedAt ? new Date(j.publishedAt) : undefined,
        } satisfies NormalizedJob;
      }),
  };
}

// ---- Free job feeds ---------------------------------------------------------

async function weWorkRemotely(cfg: SourceConfig): Promise<AdapterResult> {
  const feed = str(cfg.feed) || "https://weworkremotely.com/remote-jobs.rss";
  const res = await fetch(feed, {
    headers: { "User-Agent": "CareerForgeJobsBot/1.0 (+https://www.careerforge.com.ng)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`weworkremotely.com returned ${res.status}`);
  const xml = await res.text();
  const tag = (block: string, name: string) => {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
    return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() : "";
  };
  const jobs: NormalizedJob[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    const link = tag(block, "link") || tag(block, "guid");
    const full = decodeEntities(tag(block, "title"));
    if (!link || !full) continue;
    const idx = full.indexOf(": "); // "Company: Job title"
    const company = idx > 0 ? full.slice(0, idx) : "Remote company";
    const title = idx > 0 ? full.slice(idx + 2) : full;
    jobs.push({
      externalId: link,
      title,
      company,
      location: decodeEntities(tag(block, "region")) || "Remote",
      locationType: "REMOTE",
      type: inferJobType(`${tag(block, "type")} ${title}`),
      category: decodeEntities(tag(block, "category")) || undefined,
      description: htmlToText(tag(block, "description")),
      applyUrl: link,
      postedAt: tag(block, "pubDate") ? new Date(tag(block, "pubDate")) : undefined,
    });
  }
  return { jobs };
}

async function arbeitnow(): Promise<AdapterResult> {
  const data = await getJson<{ data: Record<string, any>[] }>("https://www.arbeitnow.com/api/job-board-api");
  return {
    jobs: data.data.map((j) => ({
      externalId: str(j.slug),
      title: str(j.title),
      company: str(j.company_name),
      location: str(j.location),
      locationType: inferLocationType(`${j.location} ${j.title}`, j.remote === true ? true : undefined),
      type: inferJobType(`${(j.job_types ?? []).join(" ")} ${j.title}`),
      category: str(j.tags?.[0]) || undefined,
      description: htmlToText(str(j.description)),
      applyUrl: str(j.url),
      postedAt: j.created_at ? new Date(Number(j.created_at) * 1000) : undefined,
    })),
  };
}

// ---- Keyed aggregator APIs (idle until a key is configured) ----------------

async function adzuna(cfg: SourceConfig): Promise<AdapterResult> {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) {
    return { jobs: [], error: "Add ADZUNA_APP_ID and ADZUNA_APP_KEY in Vercel to enable Adzuna." };
  }
  const country = (str(cfg.country) || "gb").toLowerCase(); // Adzuna has no NG feed; gb/us/za/ca/au… work
  const what = str(cfg.what);
  const qs = new URLSearchParams({
    app_id: env.ADZUNA_APP_ID,
    app_key: env.ADZUNA_APP_KEY,
    results_per_page: "50",
    "content-type": "application/json",
  });
  if (what) qs.set("what", what);
  const data = await getJson<{ results: Record<string, any>[] }>(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${qs}`,
  );
  return {
    jobs: data.results.map((j) => ({
      externalId: String(j.id),
      title: str(j.title),
      company: str(j.company?.display_name) || "Employer",
      location: str(j.location?.display_name),
      locationType: inferLocationType(`${j.title} ${j.description}`),
      type: j.contract_time === "part_time" ? "PART_TIME" : j.contract_type === "contract" ? "CONTRACT" : "FULL_TIME",
      category: str(j.category?.label) || undefined,
      salaryText: j.salary_min
        ? `${Math.round(j.salary_min).toLocaleString()}${j.salary_max ? `–${Math.round(j.salary_max).toLocaleString()}` : "+"}`
        : undefined,
      // Adzuna only supplies a snippet; the apply page has the full text.
      description: htmlToText(str(j.description)),
      applyUrl: str(j.redirect_url),
      postedAt: j.created ? new Date(j.created) : undefined,
    })),
  };
}

async function jooble(cfg: SourceConfig): Promise<AdapterResult> {
  if (!env.JOOBLE_API_KEY) return { jobs: [], error: "Add JOOBLE_API_KEY in Vercel to enable Jooble." };
  const data = await getJson<{ jobs: Record<string, any>[] }>(`https://jooble.org/api/${env.JOOBLE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: str(cfg.keywords) || "remote", location: str(cfg.location) || "Nigeria", page: "1" }),
  });
  return {
    jobs: data.jobs.map((j) => ({
      externalId: String(j.id),
      title: str(j.title),
      company: str(j.company) || "Employer",
      location: str(j.location),
      locationType: inferLocationType(`${j.location} ${j.title} ${j.snippet}`),
      type: inferJobType(`${j.type} ${j.title}`),
      salaryText: str(j.salary) || undefined,
      description: htmlToText(str(j.snippet)),
      applyUrl: str(j.link),
      postedAt: j.updated ? new Date(j.updated) : undefined,
    })),
  };
}

export async function fetchSource(type: JobSourceType, cfg: SourceConfig): Promise<AdapterResult> {
  switch (type) {
    case "GREENHOUSE": return greenhouse(cfg);
    case "LEVER": return lever(cfg);
    case "ASHBY": return ashby(cfg);
    case "WEWORKREMOTELY": return weWorkRemotely(cfg);
    case "ARBEITNOW": return arbeitnow();
    case "ADZUNA": return adzuna(cfg);
    case "JOOBLE": return jooble(cfg);
    default: return { jobs: [], error: `Source type ${type} is not supported.` };
  }
}
