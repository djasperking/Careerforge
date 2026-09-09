import type { JobImportOutput } from "@/lib/ai/types";

/**
 * AI-free best-effort parse of a pasted job posting. Used as the fallback when
 * the AI is unavailable, so a paste always produces an editable draft. It only
 * pulls what's clearly in the text — the body is kept verbatim.
 */

const LABEL = (name: string) =>
  new RegExp(`^\\s*${name}\\s*[:\\-–]\\s*(.+)$`, "im");

const REMOTE_RE = /\b(fully remote|remote(?:-first| work| role| position)?|work from home|wfh)\b/i;
const HYBRID_RE = /\bhybrid\b/i;
const ONSITE_RE = /\b(on-?site|in-?office|in person)\b/i;

const TYPE_RE: [JobImportOutput["type"], RegExp][] = [
  ["INTERNSHIP", /\binternship|intern\b/i],
  ["CONTRACT", /\bcontract|fixed[- ]term\b/i],
  ["FREELANCE", /\bfreelance|freelancer\b/i],
  ["PART_TIME", /\bpart[- ]time\b/i],
  ["FULL_TIME", /\bfull[- ]time\b/i],
];

const SALARY_RE =
  /((?:[$£€₦]|USD|NGN|GBP|EUR)\s?[\d,][\d,. ]*\s?(?:-|–|to)?\s?(?:[$£€₦]|USD|NGN|GBP|EUR)?\s?[\d,][\d,. ]*\s?(?:\/\s?(?:hr|hour|month|mo|year|yr|annum|week|wk))?|\b\d{2,3}k(?:\s?-\s?\d{2,3}k)?\b)/i;

function firstMatch(re: RegExp, text: string): string {
  return (text.match(re)?.[1] ?? "").trim().slice(0, 160);
}

export function heuristicParseJob(rawText: string): JobImportOutput {
  const text = rawText.replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);

  let title = firstMatch(LABEL("(?:job )?title|role|position"), text);
  let company = firstMatch(LABEL("company|employer|organisation|organization|about"), text);

  // Fall back to the first line(s) — many postings lead with "Title at Company".
  if (!title && nonEmpty[0]) {
    const m = nonEmpty[0].match(/^(.+?)\s+(?:at|@|[-–|·])\s+(.+)$/);
    if (m) {
      title = m[1].trim().slice(0, 160);
      if (!company) company = m[2].trim().slice(0, 160);
    } else {
      title = nonEmpty[0].slice(0, 160);
    }
  }
  if (!company && nonEmpty[1] && nonEmpty[1].length < 60) company = nonEmpty[1];

  const location =
    firstMatch(LABEL("location|based in|where"), text) ||
    (text.match(/\b(?:remote|hybrid|on-?site)\b[^.\n]{0,40}/i)?.[0] ?? "").trim().slice(0, 120);

  const locationType: JobImportOutput["locationType"] = HYBRID_RE.test(text)
    ? "HYBRID"
    : ONSITE_RE.test(text) && !REMOTE_RE.test(text)
      ? "ONSITE"
      : "REMOTE";

  const type = TYPE_RE.find(([, re]) => re.test(text))?.[0] ?? "FULL_TIME";

  const salaryText =
    firstMatch(LABEL("salary|compensation|pay|rate"), text) || (text.match(SALARY_RE)?.[0] ?? "").trim().slice(0, 120);

  return {
    title: title || "Untitled role",
    company: company || "",
    location,
    locationType,
    type,
    category: "",
    salaryText,
    // Keep the posting verbatim — the admin can tidy it in the editor.
    description: text.slice(0, 18_000),
  };
}
