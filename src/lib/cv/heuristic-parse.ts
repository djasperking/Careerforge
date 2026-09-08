import type { CVContent } from "./schema";

/**
 * Best-effort, AI-free CV parser. Used as a fallback when the AI import
 * provider is unavailable, so an upload always yields an editable draft.
 * Deliberately conservative — it never invents content, it just splits the
 * raw text into the right buckets and leaves the user to correct it.
 */

const HEADERS: { key: keyof CVContent; words: string[] }[] = [
  { key: "professionalSummary", words: ["summary", "profile", "about me", "professional summary", "career summary"] },
  { key: "careerObjective", words: ["objective", "career objective"] },
  { key: "experience", words: ["experience", "work experience", "employment", "work history", "professional experience", "career history"] },
  { key: "education", words: ["education", "academic background", "qualifications"] },
  { key: "skills", words: ["skills", "technical skills", "core competencies", "competencies", "key skills"] },
  { key: "certifications", words: ["certifications", "certificates", "licenses", "licences"] },
  { key: "projects", words: ["projects", "personal projects", "key projects"] },
  { key: "languages", words: ["languages"] },
  { key: "achievements", words: ["achievements", "accomplishments", "awards", "honors", "honours"] },
  { key: "volunteerExperience", words: ["volunteer", "volunteering", "community"] },
  { key: "references", words: ["references", "referees"] },
  { key: "additionalInformation", words: ["interests", "hobbies", "additional information", "other"] },
];

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /\b((?:https?:\/\/)?(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w#?=&./-]*)?)/i;
const LINKEDIN_RE = /(?:linkedin\.com\/in\/[\w-]+|linkedin:\s*[\w-]+)/i;
const DATE_RANGE_RE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)?\.?\s*\d{4})\s*(?:-|–|—|to)\s*((?:present|current|now)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\.?\s*\d{4})/i;

function findHeader(line: string): (keyof CVContent) | null {
  const t = line.trim().toLowerCase().replace(/[:.\-–—]+$/, "").trim();
  if (t.length > 42 || t.length < 3) return null;
  for (const h of HEADERS) {
    if (h.words.some((w) => t === w || t.startsWith(w + " ") || t === w + "s")) return h.key;
  }
  return null;
}

function splitList(text: string): string[] {
  return text
    .split(/[,•·|\n]|(?:\s{2,})|(?: - )/)
    .map((s) => s.replace(/^[-*•·\s]+/, "").trim())
    .filter((s) => s.length > 1 && s.length < 80)
    .slice(0, 60);
}

function splitEntries(body: string): string[] {
  // A blank line, or a line with a date range, tends to start a new entry.
  const blocks: string[] = [];
  let cur: string[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trimEnd();
    const isBreak = line.trim() === "" || (cur.length > 0 && DATE_RANGE_RE.test(line) && cur.join(" ").length > 40);
    if (isBreak) {
      if (cur.length) blocks.push(cur.join("\n").trim());
      cur = line.trim() ? [line] : [];
    } else {
      cur.push(line);
    }
  }
  if (cur.length) blocks.push(cur.join("\n").trim());
  return blocks.filter((b) => b.length > 3).slice(0, 25);
}

/** Returns a partial, id-less CV shape — feed it straight to `coerceCvContent`. */
export function heuristicParseCv(rawText: string): Record<string, unknown> {
  const text = rawText.replace(/\r\n/g, "\n");
  const lines = text.split("\n");

  // --- contact block (first ~10 non-empty lines) ---
  const head = lines.filter((l) => l.trim()).slice(0, 10);
  const headBlob = head.join("  ");
  const email = headBlob.match(EMAIL_RE)?.[0] ?? text.match(EMAIL_RE)?.[0] ?? "";
  const phone = headBlob.match(PHONE_RE)?.[0]?.trim() ?? text.match(PHONE_RE)?.[0]?.trim() ?? "";
  const linkedin = text.match(LINKEDIN_RE)?.[0] ?? "";
  const website =
    head.map((l) => l.match(URL_RE)?.[0]).find((u) => u && !/linkedin|@/i.test(u)) ?? "";
  const fullName =
    head.find(
      (l) =>
        /^[A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){1,3}$/.test(l.trim()) &&
        !EMAIL_RE.test(l) &&
        !/\d/.test(l),
    )?.trim() ?? head[0]?.trim() ?? "";
  const headline =
    head.find((l) => {
      const t = l.trim();
      return t && t !== fullName && !EMAIL_RE.test(t) && !PHONE_RE.test(t) && !URL_RE.test(t) && t.length < 70 && /[a-z]/.test(t);
    })?.trim() ?? "";

  // --- section bodies ---
  const sections: Partial<Record<keyof CVContent, string>> = {};
  let currentKey: (keyof CVContent) | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (currentKey && buf.length) {
      sections[currentKey] = (sections[currentKey] ? sections[currentKey] + "\n" : "") + buf.join("\n").trim();
    }
    buf = [];
  };
  for (const line of lines) {
    const h = findHeader(line);
    if (h) {
      flush();
      currentKey = h;
    } else if (currentKey) {
      buf.push(line);
    }
  }
  flush();

  const out: Record<string, unknown> = {
    personalInfo: { fullName, headline, email, phone, location: "", website, linkedin },
  };

  if (sections.professionalSummary) out.professionalSummary = sections.professionalSummary.replace(/\n+/g, " ").slice(0, 1800);
  if (sections.careerObjective) out.careerObjective = sections.careerObjective.replace(/\n+/g, " ").slice(0, 900);
  if (sections.additionalInformation) out.additionalInformation = sections.additionalInformation.replace(/\n+/g, " ").slice(0, 900);

  if (sections.skills) out.skills = splitList(sections.skills);
  if (sections.achievements) {
    out.achievements = sections.achievements
      .split("\n")
      .map((s) => s.replace(/^[-*•·\s]+/, "").trim())
      .filter((s) => s.length > 2)
      .slice(0, 20);
  }

  if (sections.experience) {
    out.experience = splitEntries(sections.experience).map((block) => {
      const bl = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const dates = block.match(DATE_RANGE_RE);
      const firstLine = bl[0] ?? "";
      const [a, b] = firstLine.split(/\s+(?:at|@|[-–—|·])\s+/);
      return {
        company: (b || a || "").replace(DATE_RANGE_RE, "").trim().slice(0, 150),
        title: (b ? a : bl[1] ?? "").replace(DATE_RANGE_RE, "").trim().slice(0, 150),
        location: "",
        startDate: dates?.[1]?.trim() ?? "",
        endDate: dates?.[2]?.trim() ?? "",
        current: /present|current|now/i.test(dates?.[2] ?? ""),
        bullets: bl
          .slice(1)
          .filter((l) => l !== firstLine && !DATE_RANGE_RE.test(l))
          .map((l) => l.replace(/^[-*•·\s]+/, "").trim())
          .filter((l) => l.length > 3)
          .slice(0, 15),
      };
    });
  }

  if (sections.education) {
    out.education = splitEntries(sections.education).map((block) => {
      const bl = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const dates = block.match(DATE_RANGE_RE);
      return {
        institution: (bl[0] ?? "").replace(DATE_RANGE_RE, "").trim().slice(0, 150),
        degree: (bl[1] ?? "").replace(DATE_RANGE_RE, "").trim().slice(0, 150),
        field: "",
        startDate: dates?.[1]?.trim() ?? "",
        endDate: dates?.[2]?.trim() ?? "",
        description: bl.slice(2).join(" ").slice(0, 500),
      };
    });
  }

  if (sections.certifications) {
    out.certifications = sections.certifications
      .split("\n")
      .map((l) => l.replace(/^[-*•·\s]+/, "").trim())
      .filter((l) => l.length > 2)
      .slice(0, 20)
      .map((name) => ({ name: name.slice(0, 150), issuer: "", issueDate: "", credentialId: "" }));
  }

  if (sections.languages) {
    out.languages = splitList(sections.languages).map((name) => ({ name: name.slice(0, 60), proficiency: "" }));
  }

  return out;
}
