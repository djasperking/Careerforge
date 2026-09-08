import { z } from "zod";

/**
 * Structured CV document stored in CV.content (and snapshotted into
 * CVVersion). Covers all 13 sections from the spec. Every field defaults to
 * an empty value so a brand-new CV always parses.
 */

const id = () => z.string().min(1).max(60);

export const experienceItemSchema = z.object({
  id: id(),
  company: z.string().max(160).default(""),
  title: z.string().max(160).default(""),
  location: z.string().max(160).default(""),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string().max(400)).max(20).default([]),
});

export const educationItemSchema = z.object({
  id: id(),
  institution: z.string().max(160).default(""),
  degree: z.string().max(160).default(""),
  field: z.string().max(160).default(""),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
  description: z.string().max(600).default(""),
});

export const certificationItemSchema = z.object({
  id: id(),
  name: z.string().max(160).default(""),
  issuer: z.string().max(160).default(""),
  issueDate: z.string().max(40).default(""),
  credentialId: z.string().max(120).default(""),
});

export const projectItemSchema = z.object({
  id: id(),
  name: z.string().max(160).default(""),
  description: z.string().max(600).default(""),
  url: z.string().max(240).default(""),
});

export const languageItemSchema = z.object({
  id: id(),
  name: z.string().max(80).default(""),
  proficiency: z.string().max(60).default(""),
});

export const volunteerItemSchema = z.object({
  id: id(),
  organization: z.string().max(160).default(""),
  role: z.string().max(160).default(""),
  startDate: z.string().max(40).default(""),
  endDate: z.string().max(40).default(""),
  description: z.string().max(600).default(""),
});

export const referenceItemSchema = z.object({
  id: id(),
  name: z.string().max(160).default(""),
  relationship: z.string().max(160).default(""),
  contact: z.string().max(200).default(""),
});

export const cvContentSchema = z.object({
  personalInfo: z
    .object({
      fullName: z.string().max(120).default(""),
      headline: z.string().max(160).default(""),
      email: z.string().max(160).default(""),
      phone: z.string().max(40).default(""),
      location: z.string().max(120).default(""),
      website: z.string().max(200).default(""),
      linkedin: z.string().max(200).default(""),
    })
    .default({}),
  professionalSummary: z.string().max(2000).default(""),
  careerObjective: z.string().max(1000).default(""),
  experience: z.array(experienceItemSchema).max(30).default([]),
  education: z.array(educationItemSchema).max(20).default([]),
  skills: z.array(z.string().max(80)).max(60).default([]),
  certifications: z.array(certificationItemSchema).max(30).default([]),
  projects: z.array(projectItemSchema).max(30).default([]),
  achievements: z.array(z.string().max(300)).max(30).default([]),
  languages: z.array(languageItemSchema).max(20).default([]),
  volunteerExperience: z.array(volunteerItemSchema).max(20).default([]),
  references: z.array(referenceItemSchema).max(20).default([]),
  additionalInformation: z.string().max(1000).default(""),
});

export type CVContent = z.infer<typeof cvContentSchema>;
export type ExperienceItem = z.infer<typeof experienceItemSchema>;
export type EducationItem = z.infer<typeof educationItemSchema>;
export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type LanguageItem = z.infer<typeof languageItemSchema>;
export type VolunteerItem = z.infer<typeof volunteerItemSchema>;
export type ReferenceItem = z.infer<typeof referenceItemSchema>;

export const CV_SECTIONS = [
  "personalInfo", "professionalSummary", "careerObjective", "experience", "education",
  "skills", "certifications", "projects", "achievements", "languages",
  "volunteerExperience", "references", "additionalInformation",
] as const;

export const SECTION_LABELS: Record<(typeof CV_SECTIONS)[number], string> = {
  personalInfo: "Personal information",
  professionalSummary: "Professional summary",
  careerObjective: "Career objective",
  experience: "Work experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  projects: "Projects",
  achievements: "Achievements",
  languages: "Languages",
  volunteerExperience: "Volunteer experience",
  references: "References",
  additionalInformation: "Additional information",
};

/**
 * Turn a messy skills blob (AI output, a pasted CV line, a comma soup) into a
 * short, clean, de-duplicated list. Splits on common delimiters, trims noise,
 * drops sentence-length entries, collapses case-insensitive duplicates, and
 * caps the list so a CV never shows "a row of gibberish".
 */
export function normalizeSkills(input: unknown, cap = 14): string[] {
  const raw: string[] = Array.isArray(input)
    ? input.map((s) => String(s ?? ""))
    : [String(input ?? "")];

  const pieces = raw
    .flatMap((s) => s.split(/[,;•·|•‣◦\n\r\t]+|\s{2,}|\s+[/–—-]\s+/))
    .map((s) =>
      s
        .replace(/^[\s\-*•·–—]+/, "")
        .replace(/[\s.;:]+$/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of pieces) {
    if (p.length < 1 || p.length > 40) continue; // not a skill — empty or a sentence
    if (/^[^a-z0-9]+$/i.test(p)) continue; // punctuation only
    if ((p.match(/\s/g)?.length ?? 0) > 4) continue; // more than 5 words = prose
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= cap) break;
  }
  return out;
}

export function emptyCvContent(): CVContent {
  return cvContentSchema.parse({});
}

/** Parse possibly-partial/legacy JSON from the DB, filling in any gaps. */
export function parseCvContent(raw: unknown): CVContent {
  const result = cvContentSchema.safeParse(raw);
  return result.success ? result.data : emptyCvContent();
}

/**
 * Coerce loosely-shaped JSON (e.g. an AI-parsed CV) into a valid CVContent:
 * gives every list item a stable id before validating, so items that arrive
 * without one aren't silently dropped.
 */
export function coerceCvContent(raw: unknown): CVContent {
  if (!raw || typeof raw !== "object") return emptyCvContent();
  const obj: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  const withIds = ["experience", "education", "certifications", "projects", "languages", "volunteerExperience", "references"];
  for (const key of withIds) {
    const arr = obj[key];
    if (Array.isArray(arr)) {
      obj[key] = arr
        .filter((it) => it && typeof it === "object")
        .map((it, i) => ({
          ...(it as Record<string, unknown>),
          id: String((it as Record<string, unknown>).id ?? "").trim() || `${key}-${i + 1}-${Math.random().toString(36).slice(2, 8)}`,
        }));
    }
  }
  if ("skills" in obj) obj.skills = normalizeSkills(obj.skills);
  return parseCvContent(obj);
}

export interface CvTemplateConfig {
  columns: 1 | 2;
  font: string;
  spacing: "compact" | "comfortable" | "spacious";
  sectionOrder: string[];
  /** Accent colour for the name, section rules and skill chips. */
  accent: string;
  /** Alignment of the name / headline / contact block. */
  headerAlign: "left" | "center";
  /** How section headings are drawn. */
  headingStyle: "underline" | "bar" | "plain";
  /** Upper-case section headings (classic ATS look) vs. title case. */
  uppercaseHeadings: boolean;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Legacy / shorthand section keys used in older template configs. */
const SECTION_ALIASES: Record<string, (typeof CV_SECTIONS)[number]> = {
  summary: "professionalSummary",
  objective: "careerObjective",
  volunteer: "volunteerExperience",
  additional: "additionalInformation",
  personal: "personalInfo",
};

export function parseTemplateConfig(raw: unknown): CvTemplateConfig {
  const c = (raw ?? {}) as Partial<CvTemplateConfig>;
  const raw0 = Array.isArray(c.sectionOrder) && c.sectionOrder.length ? c.sectionOrder : [...CV_SECTIONS];

  // Normalise aliases, drop unknowns, then append any real section the config
  // forgot — so a section the user filled in is never silently hidden.
  const seen = new Set<string>();
  const normalised: string[] = [];
  for (const key of raw0) {
    const real = SECTION_ALIASES[key] ?? key;
    if ((CV_SECTIONS as readonly string[]).includes(real) && !seen.has(real)) {
      seen.add(real);
      normalised.push(real);
    }
  }
  for (const key of CV_SECTIONS) {
    if (!seen.has(key)) normalised.push(key);
  }

  return {
    columns: c.columns === 2 ? 2 : 1,
    font: c.font ?? "Helvetica",
    spacing: c.spacing ?? "comfortable",
    sectionOrder: normalised,
    accent: typeof c.accent === "string" && HEX_RE.test(c.accent) ? c.accent : "#404040",
    headerAlign: c.headerAlign === "left" ? "left" : "center",
    headingStyle:
      c.headingStyle === "bar" || c.headingStyle === "plain" ? c.headingStyle : "underline",
    uppercaseHeadings: c.uppercaseHeadings === false ? false : true,
  };
}

/** Rough, honest completeness score — not tied to any AI call. */
export function scoreCvCompleteness(c: CVContent): number {
  const checks = [
    !!c.personalInfo.fullName,
    !!c.personalInfo.email,
    !!c.professionalSummary,
    c.experience.length > 0,
    c.education.length > 0,
    c.skills.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
