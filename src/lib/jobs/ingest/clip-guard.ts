/**
 * Pure checks that keep the browser extension from filing junk: job lists,
 * careers landing pages and marketing pages are not jobs.
 */

/** Page addresses that are job *lists* or landing pages, never one role. */
const LISTING_SEGMENTS = new Set([
  "", "jobs", "job", "careers", "career", "opportunities", "explore", "roles", "openings", "vacancies", "search",
  "home", "work", "apply", "join", "positions", "hiring", "remote-jobs", "jobs-search",
]);

/** Titles that are page headings, not role names. */
const GENERIC_TITLE =
  /^(?:(?:explore|open|search|all) (?:roles|jobs|opportunities|positions)\b|join (?:us|our team)\b|don'?t see a perfect role\b|(?:jobs?|careers?|opportunities|home)\s*[!?.]*$)/i;

const JOB_WORDS =
  /(responsibilit|requirement|qualification|you will|you'll|we are (looking|hiring)|we're (looking|hiring)|salary|compensation|benefits|years of experience|experience (in|with)|skills|apply (now|today|for))/gi;

/**
 * Is this page a single job posting? Structured JobPosting data is proof.
 * Otherwise the address must point at one role (not a list or landing page)
 * and the text must read like a job description.
 */
export function looksLikeSingleJob(opts: { url: string; text: string; hasStructuredData: boolean }): boolean {
  if (opts.hasStructuredData) return true;
  const last = new URL(opts.url).pathname.split("/").filter(Boolean).pop()?.toLowerCase() ?? "";
  if (LISTING_SEGMENTS.has(last)) return false;
  if (opts.text.length < 400) return false;
  const hits = new Set((opts.text.match(JOB_WORDS) ?? []).map((w) => w.toLowerCase()));
  return hits.size >= 3;
}

export function isGenericTitle(title: string): boolean {
  return GENERIC_TITLE.test(title.trim());
}
