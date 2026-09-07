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

/**
 * Public counters for the marketing homepage. Each starts from a launch
 * baseline and climbs with real activity; shown rounded down so the number is
 * never overstated.
 */
const STAT_BASELINE = { cvs: 300, certs: 200, enrollments: 100 };

export async function getPlatformStats() {
  const [cvs, certs, enrollments] = await Promise.all([
    db.cV.count({ where: { deletedAt: null } }),
    db.certificate.count({ where: { revokedAt: null } }),
    db.enrollment.count(),
  ]);
  const show = (n: number) => {
    if (n < 1000) return `${Math.floor(n / 10) * 10}+`;
    return `${(Math.floor(n / 100) / 10).toFixed(1)}k+`;
  };
  return [
    { label: "CVs built", value: show(STAT_BASELINE.cvs + cvs) },
    { label: "Certificates issued", value: show(STAT_BASELINE.certs + certs) },
    { label: "Course enrolments", value: show(STAT_BASELINE.enrollments + enrollments) },
  ];
}

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
