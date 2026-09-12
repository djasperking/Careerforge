import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { getSocialLinks } from "@/lib/site";
import type { SocialPlatform } from "@prisma/client";

const DEFAULT_FOLLOW_REWARD_CENTS = 5_000; // ₦50 per platform

async function numSetting(key: string, fallback: number) {
  const row = await db.systemSetting.findUnique({ where: { key } });
  return typeof row?.value === "number" ? row.value : fallback;
}

/** Credit awarded for a self-reported "I've followed" claim on one platform. */
export function socialFollowRewardConfig() {
  return numSetting("social.followRewardCents", DEFAULT_FOLLOW_REWARD_CENTS);
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TWITTER: "X (Twitter)",
  LINKEDIN: "LinkedIn",
};

const PLATFORM_LINK_KEY: Record<SocialPlatform, keyof Awaited<ReturnType<typeof getSocialLinks>>> = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TWITTER: "twitter",
  LINKEDIN: "linkedin",
};

/**
 * Social platforms available to claim credit for, with claim status.
 *
 * NOTE: this is an honor-system claim, not a verified follow. There is no
 * practical way to confirm a follow without paid/gated per-platform APIs, so
 * we disclose that in the UI copy rather than pretend to "verify" it.
 */
export async function socialRewardsStatus(userId: string) {
  const [links, claims, rewardCents] = await Promise.all([
    getSocialLinks(),
    db.socialFollowClaim.findMany({ where: { userId } }),
    socialFollowRewardConfig(),
  ]);
  const claimed = new Set(claims.map((c) => c.platform));
  const platforms = (Object.keys(PLATFORM_LABELS) as SocialPlatform[])
    .map((platform) => ({
      platform,
      label: PLATFORM_LABELS[platform],
      url: links[PLATFORM_LINK_KEY[platform]],
      claimed: claimed.has(platform),
    }))
    .filter((p): p is typeof p & { url: string } => Boolean(p.url));
  return { platforms, rewardCents };
}

export async function claimSocialFollow(userId: string, platform: SocialPlatform) {
  const links = await getSocialLinks();
  const url = links[PLATFORM_LINK_KEY[platform]];
  if (!url) throw new ApiError(404, "NOT_CONFIGURED", "That platform isn't set up yet.");

  const existing = await db.socialFollowClaim.findUnique({ where: { userId_platform: { userId, platform } } });
  if (existing) throw new ApiError(409, "ALREADY_CLAIMED", "You've already claimed credit for this platform.");

  const rewardCents = await socialFollowRewardConfig();
  await db.$transaction([
    db.socialFollowClaim.create({ data: { userId, platform, creditedCents: rewardCents } }),
    db.user.update({ where: { id: userId }, data: { creditCents: { increment: rewardCents } } }),
    db.notification.create({
      data: {
        userId,
        type: "PAYMENT",
        title: "Credit added",
        body: `Thanks for following us on ${PLATFORM_LABELS[platform]} — credit has been added to your account.`,
        linkUrl: "/dashboard/profile",
      },
    }),
  ]);
  return rewardCents;
}
