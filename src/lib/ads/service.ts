import { db } from "@/lib/db";

export const PLACEMENTS = [
  "HOMEPAGE", "DASHBOARD", "COURSE_PAGE", "CV_BUILDER", "BLOG",
  "SEARCH_RESULTS", "SIDEBAR", "HEADER", "FOOTER",
] as const;
export type Placement = (typeof PLACEMENTS)[number];

export async function adsGloballyEnabled() {
  const setting = await db.systemSetting.findUnique({ where: { key: "ads.enabled" } });
  return setting?.value !== false;
}

/**
 * Pick one eligible ad for a placement: ACTIVE, within its date window, and
 * under its impression/click caps — highest priority first, then most
 * recently created. Returns null if nothing is eligible (including when ads
 * are globally disabled).
 */
export async function pickAdForPlacement(placement: Placement) {
  if (!(await adsGloballyEnabled())) return null;

  const now = new Date();
  const candidates = await db.advertisement.findMany({
    where: {
      placement,
      status: "ACTIVE",
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { impressions: true, clicks: true } } },
  });

  for (const ad of candidates) {
    if (ad.maxImpressions != null && ad._count.impressions >= ad.maxImpressions) continue;
    if (ad.maxClicks != null && ad._count.clicks >= ad.maxClicks) continue;
    return ad;
  }
  return null;
}

export async function recordImpression(adId: string, userId: string | null, path: string) {
  await db.adImpression.create({ data: { adId, userId, path } }).catch(() => {});
}

export async function recordClick(adId: string, userId: string | null) {
  await db.adClick.create({ data: { adId, userId } }).catch(() => {});
}
