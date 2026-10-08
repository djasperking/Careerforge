/** Pure display helpers for job listings (no server imports, safe anywhere). */

/** "Today", "Yesterday", "3d ago", "2w ago", "5 Oct 2026". */
export function postedAgo(date: Date, now = new Date()): string {
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function isNewJob(date: Date, now = new Date()): boolean {
  return now.getTime() - date.getTime() < 3 * 86_400_000;
}

/** 1–2 letters for the company mark: "Lemon.io" → "L", "Scale AI" → "SA". */
export function companyInitials(name: string): string {
  // Split on spaces first, then drop punctuation inside each word ("Lemon.io" is one word).
  const words = name.split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")).filter(Boolean);
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/** A stable hue (0–359) per company so each gets its own, consistent colour. */
export function companyHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

const CURRENCY = String.raw`(?:[$£€₦]|USD|NGN|GBP|EUR)`;
const AMOUNT = String.raw`${CURRENCY}\s?\d[\d,.]*(?:\s?[kK])?`;
const PAY_RE = new RegExp(
  String.raw`${AMOUNT}(?:\s?(?:-|–|to)\s?(?:${CURRENCY}\s?)?\d[\d,.]*(?:\s?[kK])?)?(?:\s?/\s?[a-z]+|\s?per\s+[a-z]+(?: (?!depending|based|plus|and|for|with|on|of|subject|if)[a-z]+)?)?`,
  "i",
);

/**
 * Short pay text for a card, e.g. "$100–$150/hr". Long sentences ("Estimated
 * earning potential of approximately $30 per approved task") are reduced to the
 * amount itself; if there's no amount in a long text, nothing is shown rather
 * than a chopped sentence.
 */
export function shortPay(salaryText: string | null | undefined): string | null {
  const t = (salaryText ?? "").trim();
  if (!t) return null;
  if (t.length <= 28) return t;
  const m = t.match(PAY_RE);
  return m ? m[0].trim().slice(0, 32) : null;
}
