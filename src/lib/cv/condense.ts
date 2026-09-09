import type { CVContent } from "./schema";
import { SECTION_LABELS } from "./schema";

/**
 * Progressive "condense ladder" for fitting a CV onto a target page count.
 * Each step is a pure transform on a CVContent copy plus a `font`/`spacing`
 * hint. The PDF route applies steps one at a time, re-rendering and counting
 * pages after each, and stops as soon as the CV fits (or it runs out of
 * steps). Nothing here mutates the stored CV — it only affects the download.
 */

export interface CondenseHint {
  /** Multiply the base font size by this (1 = unchanged). */
  fontScale: number;
  /** Force the tightest vertical rhythm regardless of the template. */
  forceCompact: boolean;
}

export interface CondenseStep {
  /** Short human label for "what we trimmed" messaging. */
  describe: string;
  apply: (c: CVContent, hint: CondenseHint) => void;
}

const OPTIONAL_SECTIONS: (keyof CVContent)[] = [
  "references",
  "additionalInformation",
  "languages",
  "volunteerExperience",
  "achievements",
  "careerObjective",
  "projects",
];

function clearSection(c: CVContent, key: keyof CVContent) {
  const cur = c[key];
  const bag = c as Record<string, unknown>;
  if (Array.isArray(cur)) bag[key] = [];
  else if (typeof cur === "string") bag[key] = "";
}

/** The ladder, in the order it should be applied. */
export function condenseLadder(): CondenseStep[] {
  const steps: CondenseStep[] = [
    {
      describe: "tightened the spacing and type size",
      apply: (_c, hint) => {
        hint.forceCompact = true;
        hint.fontScale = 0.94;
      },
    },
  ];

  for (const key of OPTIONAL_SECTIONS) {
    steps.push({
      describe: `hid ${SECTION_LABELS[key as keyof typeof SECTION_LABELS].toLowerCase()}`,
      apply: (c) => clearSection(c, key),
    });
  }

  steps.push({
    describe: "shortened older roles to their top 3 points",
    apply: (c) => {
      c.experience = c.experience.map((e, i) => ({
        ...e,
        bullets: e.bullets.slice(0, i === 0 ? 5 : 3),
      }));
    },
  });

  steps.push({
    describe: "kept only your 4 most recent roles",
    apply: (c) => {
      c.experience = c.experience.slice(0, 4);
    },
  });

  steps.push({
    describe: "trimmed the professional summary",
    apply: (c) => {
      if (c.professionalSummary.length > 320) {
        c.professionalSummary = c.professionalSummary.slice(0, 300).replace(/\s+\S*$/, "") + "…";
      }
    },
  });

  return steps;
}

/** Apply the first `n` ladder steps to a deep copy of `content`. */
export function applyCondense(
  content: CVContent,
  n: number,
): { content: CVContent; hint: CondenseHint; notes: string[] } {
  const copy: CVContent = JSON.parse(JSON.stringify(content));
  const hint: CondenseHint = { fontScale: 1, forceCompact: false };
  const ladder = condenseLadder();
  const notes: string[] = [];
  for (let i = 0; i < Math.min(n, ladder.length); i++) {
    ladder[i].apply(copy, hint);
    notes.push(ladder[i].describe);
  }
  return { content: copy, hint, notes };
}

export const CONDENSE_MAX_STEPS = condenseLadder().length;
