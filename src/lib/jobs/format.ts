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
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
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

/** Short pay text for a card ("$100–$150/hr"), or null when there's none. */
export function shortPay(salaryText: string | null | undefined): string | null {
  const t = (salaryText ?? "").trim();
  return t ? t.slice(0, 40) : null;
}
