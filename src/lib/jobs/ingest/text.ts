import type { JobLocationType, JobType } from "@prisma/client";

const ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ",
  "&ndash;": "–", "&mdash;": "—", "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”", "&bull;": "•",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z]+;|&#39;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

/** HTML (possibly entity-escaped HTML, as Greenhouse returns it) → readable plain text. */
export function htmlToText(html: string): string {
  let s = html;
  // Greenhouse (and some feeds) entity-encode their HTML, occasionally twice:
  // keep decoding while escaped tags remain, then strip the real ones.
  for (let pass = 0; pass < 3; pass++) {
    if (/&(?:amp;)*lt;\/?[a-z]/i.test(s) && !/<\/?[a-z][^>]*>/i.test(s)) s = decodeEntities(s);
    s = s
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
      .replace(/<\s*br\s*\/?>/gi, "\n")
      // Keep structure as Markdown so the job page can render real headings and
      // lists. Headings must be handled before the generic closing-tag rule below.
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_m, t: string) => {
        const text = t.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        return text ? "\n\n## " + text + "\n\n" : "\n";
      })
      .replace(/<\/(p|div|ul|ol|tr)>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<[^>]+>/g, "");
    if (!/&(?:amp;)*lt;\/?[a-z]/i.test(s)) break;
  }
  return decodeEntities(s)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function inferLocationType(text: string, remoteFlag?: boolean): JobLocationType {
  if (remoteFlag === true) return "REMOTE";
  const t = text.toLowerCase();
  if (/\bhybrid\b/.test(t)) return "HYBRID";
  if (/\b(remote|anywhere|work from home|distributed)\b/.test(t)) return "REMOTE";
  return remoteFlag === false ? "ONSITE" : "ONSITE";
}

export function inferJobType(text: string): JobType {
  const t = text.toLowerCase();
  if (/intern/.test(t)) return "INTERNSHIP";
  if (/part[\s-]?time/.test(t)) return "PART_TIME";
  if (/freelance/.test(t)) return "FREELANCE";
  if (/contract|temporary|temp\b/.test(t)) return "CONTRACT";
  return "FULL_TIME";
}
