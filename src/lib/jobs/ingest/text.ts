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
      .replace(/<\/(p|div|h[1-6]|ul|ol|tr)>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "\n• ")
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

/** Public-API fetch with a timeout and an honest user agent. */
export async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": "CareerForgeJobsBot/1.0 (+https://www.careerforge.com.ng)", Accept: "application/json", ...init.headers },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} returned ${res.status}`);
  return (await res.json()) as T;
}

/**
 * Whether robots.txt lets a generic crawler fetch this URL. Used by the
 * page-based sources so ingestion stops by itself if a site ever disallows it.
 * Honours the `User-agent: *` group's Disallow/Allow prefixes (longest wins).
 */
export async function robotsAllows(url: string): Promise<boolean> {
  const u = new URL(url);
  let body = "";
  try {
    const res = await fetch(`${u.origin}/robots.txt`, {
      headers: { "User-Agent": "CareerForgeJobsBot/1.0 (+https://www.careerforge.com.ng)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return true; // no robots file: nothing is disallowed
    body = await res.text();
  } catch {
    return false; // can't verify — don't crawl
  }
  let inStar = false;
  let best: { len: number; allow: boolean } | null = null;
  for (const raw of body.split("\n")) {
    const line = raw.split("#")[0].trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") inStar = val === "*";
    else if (inStar && (key === "disallow" || key === "allow") && val && u.pathname.startsWith(val)) {
      if (!best || val.length > best.len) best = { len: val.length, allow: key === "allow" };
    }
  }
  return best ? best.allow : true;
}
