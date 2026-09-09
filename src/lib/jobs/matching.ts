import { db } from "@/lib/db";
import { parseCvContent } from "@/lib/cv/schema";

/**
 * Lightweight keyword matching between a job-seeker and job posts. No AI — we
 * build a keyword set from the user's profile + most recent CV and score each
 * job on how many of those keywords appear in its title / category / body.
 */

const STOP = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "was", "will", "have", "has",
  "this", "that", "from", "job", "role", "work", "team", "experience", "years", "year",
  "skills", "ability", "strong", "good", "plus", "etc", "using", "used", "including",
  "remote", "onsite", "hybrid", "full", "part", "time", "contract", "week", "month",
]);

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z+#.]{2,}/g) ?? []).filter((w) => !STOP.has(w));
}

/** Build the keyword set that represents what this user is looking for. */
export async function userJobKeywords(userId: string): Promise<Set<string>> {
  const [profile, cv] = await Promise.all([
    db.profile.findUnique({ where: { userId } }),
    db.cV.findFirst({ where: { userId, deletedAt: null }, orderBy: { updatedAt: "desc" } }),
  ]);

  const words = new Set<string>();
  const add = (s?: string | null) => tokens(s ?? "").forEach((w) => words.add(w));

  profile?.skills.forEach((s) => add(s));
  profile?.careerInterests.forEach((s) => add(s));
  add(profile?.headline);

  if (cv) {
    const c = parseCvContent(cv.content);
    c.skills.forEach((s) => add(s));
    add(c.personalInfo.headline);
    c.experience.slice(0, 4).forEach((e) => {
      add(e.title);
      e.bullets.slice(0, 2).forEach((b) => add(b));
    });
  }

  return words;
}

export interface JobMatch {
  id: string;
  slug: string;
  title: string;
  company: string;
  salaryText: string | null;
  score: number;
  hits: string[];
}

type JobRow = {
  id: string; slug: string; title: string; company: string;
  category: string | null; description: string; salaryText: string | null;
};

/** Score one job against a keyword set. */
export function scoreJob(keywords: Set<string>, job: JobRow): JobMatch {
  if (keywords.size === 0) return { ...job, score: 0, hits: [] };
  const haystack = new Set(tokens(`${job.title} ${job.title} ${job.category ?? ""} ${job.description}`));
  const hits: string[] = [];
  for (const k of keywords) if (haystack.has(k)) hits.push(k);
  // Title matches count double.
  const titleTokens = new Set(tokens(job.title));
  const titleBonus = hits.filter((h) => titleTokens.has(h)).length;
  return { ...job, score: hits.length + titleBonus, hits: hits.slice(0, 6) };
}

/** Best job matches for a user among the given jobs, above a small threshold. */
export function rankMatches(keywords: Set<string>, jobs: JobRow[], min = 2): JobMatch[] {
  return jobs
    .map((j) => scoreJob(keywords, j))
    .filter((m) => m.score >= min)
    .sort((a, b) => b.score - a.score);
}
