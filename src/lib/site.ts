import { db } from "@/lib/db";

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
};

export const SOCIAL_KEYS = [
  "social.facebook",
  "social.instagram",
  "social.twitter",
  "social.linkedin",
] as const;

/** Public social profile URLs, configured in Admin → Settings (SystemSetting). */
export async function getSocialLinks(): Promise<SocialLinks> {
  const rows = await db.systemSetting.findMany({ where: { key: { in: [...SOCIAL_KEYS] } } });
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const pick = (k: string) => {
    const v = m[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  return {
    facebook: pick("social.facebook"),
    instagram: pick("social.instagram"),
    twitter: pick("social.twitter"),
    linkedin: pick("social.linkedin"),
  };
}
