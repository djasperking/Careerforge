/**
 * Tidies the raw text a browser clip captures from a job page: strips the
 * site's own menu and buttons, drops lines the job header already shows, turns
 * section labels into headings and short lines under "Responsibilities" or
 * "Requirements" into bullet lists. Safe to run twice on the same text.
 */

/** Menu, footer and button text that is never part of a job description. */
const CHROME = new Set(
  [
    "employers", "employer", "jobseekers", "job seekers", "jobseeker", "job seeker", "partners", "partner", "about us", "about",
    "contact us", "contact", "home", "menu", "login", "log in", "sign in", "sign up", "register", "sign out", "logout",
    "post a job", "find jobs", "find a job", "browse jobs", "search jobs", "all jobs", "jobs", "careers", "blog", "faq", "help",
    "support", "pricing", "privacy", "privacy policy", "terms", "terms of use", "terms and conditions", "cookies", "cookie policy",
    "apply", "apply now", "apply today", "apply for this job", "apply for this position", "apply on company site",
    "easy apply", "quick apply", "save", "save job", "saved", "share", "share this job", "back", "back to jobs", "back to search",
    "report this job", "report job", "skip to content", "skip to main content", "next", "previous", "close", "new", "featured",
    "similar jobs", "related jobs", "view all jobs", "view more jobs", "load more", "subscribe", "follow us", "all rights reserved",
  ].map((s) => s.toLowerCase()),
);

export function isChromeLine(line: string): boolean {
  const t = line.trim().replace(/[\s:|>»›•·\-–—]+$/g, "").replace(/^[\s|>»›•·\-–—]+/g, "").toLowerCase();
  return t.length > 0 && CHROME.has(t);
}

/** True for words a site menu uses, so they are never taken for a job title or company. */
export function isChromeWord(text: string): boolean {
  return isChromeLine(text);
}

const HEADINGS = [
  "about this position", "about this role", "about this job", "about the role", "about the position", "about the job",
  "about us", "about the company", "about the team", "about you", "about the opportunity", "job description", "job summary",
  "position summary", "role summary", "role overview", "overview", "summary", "the role", "your role", "the opportunity",
  "job responsibilities", "responsibilities", "key responsibilities", "main responsibilities", "duties", "key duties",
  "what you'll do", "what you will do", "what you’ll do", "your responsibilities", "day to day", "in this role you will",
  "what we're looking for", "what we’re looking for", "who you are", "who we are", "what you bring", "what you'll bring",
  "skills/requirements", "skills / requirements", "skills and requirements", "skills & requirements", "requirements",
  "minimum requirements", "qualifications", "minimum qualifications", "preferred qualifications", "preferred skills",
  "required skills", "skills", "experience", "education", "nice to have", "bonus points", "benefits", "perks",
  "benefits and perks", "what we offer", "why join us", "why work with us", "compensation", "salary", "pay", "schedule", "hours",
  "location", "how to apply", "application process", "equal opportunity", "equal opportunity employer",
];
const HEADING_SET = new Set(HEADINGS.map((h) => h.toLowerCase()));

/** Sections whose short lines are really list items. */
const LIST_SECTION = /(responsibilit|duties|requirement|qualification|skills|what you|what we're looking|what we’re looking|who you are|nice to have|bonus|benefits|perks|what we offer|experience|education|day to day|in this role)/i;

const META_LINE = /^this is an? (?:\w+[\s-]?)*(?:opportunity|position|role|job)\.?$/i;
const BARE_FACT = /^(?:remote|hybrid|on-?site|onsite|contract|full[\s-]?time|part[\s-]?time|freelance|internship|temporary|worldwide|anywhere)\.?$/i;
const SALARY_LINE = /^(?:[$£€₦]|usd|ngn|gbp|eur)\s?[\d,.]+(?:\s?(?:-|–|to)\s?(?:[$£€₦]|usd|ngn|gbp|eur)?\s?[\d,.]+)?\s*(?:k)?\s*(?:\/|per\s)?\s*(?:hr|hour|hourly|month|monthly|year|yearly|annum|week|weekly)?\.?$/i;
const BULLET = /^\s*(?:[-*•·▪◦►➤✓✔]|\d{1,2}[.)])\s+/;

export interface CleanHints {
  title?: string;
  company?: string;
  location?: string;
  salaryText?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function headingOf(line: string): string | null {
  const m = line.match(/^#{2,3}\s+(.+)$/);
  if (m) return m[1].trim();
  const t = line.replace(/[:：]\s*$/, "").trim();
  if (t.length > 60) return null;
  if (HEADING_SET.has(norm(t))) return t;
  // A short label ending in a colon ("Nice to have:") is a heading too.
  if (/[:：]\s*$/.test(line) && t.split(/\s+/).length <= 5 && !/[.!?]$/.test(t)) return t;
  return null;
}

/** Remove the page's menu/buttons from the start of captured text (so the real title comes first). */
export function stripPageChrome(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => !isChromeLine(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** First real line of a clip: the role title, once menu text is gone. */
export function firstContentLine(raw: string): string {
  return stripPageChrome(raw).split("\n").find((l) => l.trim().length >= 3 && l.length <= 140) ?? "";
}

export function structureJobDescription(raw: string, hints: CleanHints = {}): string {
  const title = norm(hints.title ?? "");
  const company = norm(hints.company ?? "");
  const location = norm(hints.location ?? "");
  const salary = norm(hints.salaryText ?? "");

  const kept: string[] = [];
  for (const original of raw.replace(/\r\n/g, "\n").split("\n")) {
    const line = original.replace(/\s+/g, " ").trim();
    if (!line) {
      kept.push("");
      continue;
    }
    if (isChromeLine(line)) continue;
    const n = norm(line);
    if (title && n === title) continue; // the title sits in the page header already
    if (company && n === company) continue;
    if (location && n === location) continue;
    if (salary && n.length < 60 && (n === salary || n.includes(salary))) continue;
    if (META_LINE.test(line) || BARE_FACT.test(line) || SALARY_LINE.test(line)) continue;
    // Drop a repeat of the same short line (menus and breadcrumbs repeat themselves).
    if (line.length < 80 && kept.length && norm(kept[kept.length - 1]) === n) continue;
    kept.push(line);
  }

  const out: string[] = [];
  let listMode = false;
  const push = (s: string) => out.push(s);
  const blank = () => {
    if (out.length && out[out.length - 1] !== "") out.push("");
  };

  for (let i = 0; i < kept.length; i++) {
    const line = kept[i];
    if (!line) {
      blank();
      continue;
    }
    const heading = headingOf(line);
    if (heading) {
      blank();
      push("## " + heading);
      blank();
      listMode = LIST_SECTION.test(heading);
      continue;
    }
    if (BULLET.test(line)) {
      push("- " + line.replace(BULLET, "").trim());
      continue;
    }
    if (listMode && line.length <= 240) {
      push("- " + line);
      continue;
    }
    blank();
    push(line);
    blank();
  }

  // A list that follows another list item stays together; everything else is spaced.
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
