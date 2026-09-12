import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

const DEFAULT_REWARD_CENTS = 50_000; // ₦500
const DEFAULT_SIGNUP_BONUS_CENTS = 10_000; // ₦100

async function numSetting(key: string, fallback: number) {
  const row = await db.systemSetting.findUnique({ where: { key } });
  return typeof row?.value === "number" ? row.value : fallback;
}

export function referralRewardConfig() {
  return numSetting("referral.rewardCents", DEFAULT_REWARD_CENTS);
}

/** Welcome credit given to a NEW user who registers via someone's referral
 * link — separate from and in addition to the referrer's own reward, which
 * only pays out on the referred user's first purchase (see below). */
export function referralSignupBonusConfig() {
  return numSetting("referral.signupBonusCents", DEFAULT_SIGNUP_BONUS_CENTS);
}

function code() {
  return randomBytes(5).toString("hex"); // 10 hex chars
}

/** Return the user's referral code, creating one on first use. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;
  for (let i = 0; i < 5; i++) {
    const c = code();
    try {
      await db.user.update({ where: { id: userId }, data: { referralCode: c } });
      return c;
    } catch {
      /* unique clash — retry */
    }
  }
  throw new Error("Could not generate a referral code");
}

/**
 * Attribute a newly-registered user to a referrer by code, and grant the new
 * user a one-time welcome credit for signing up through the link. No-op if
 * the code is invalid, self-referral, or the user is already attributed.
 */
export async function attributeReferral(newUserId: string, refCode: string | undefined) {
  if (!refCode) return;
  const referrer = await db.user.findUnique({ where: { referralCode: refCode }, select: { id: true } });
  if (!referrer || referrer.id === newUserId) return;

  const attributed = await db.user.updateMany({
    where: { id: newUserId, referredById: null },
    data: { referredById: referrer.id },
  });
  if (attributed.count === 0) return; // already attributed to someone

  const bonusCents = await referralSignupBonusConfig();
  if (bonusCents <= 0) return;

  await db.$transaction([
    db.user.update({ where: { id: newUserId }, data: { creditCents: { increment: bonusCents } } }),
    db.notification.create({
      data: {
        userId: newUserId,
        type: "PAYMENT",
        title: "Welcome credit",
        body: "You signed up with a referral link — account credit has been added, visible on your profile.",
        linkUrl: "/dashboard/profile",
      },
    }),
  ]);
}

/**
 * When a referred user completes their first paid purchase, credit the
 * referrer once. Idempotent on the referred user.
 */
export async function rewardReferralOnFirstPurchase(transaction: {
  id: string;
  userId: string;
  currency: string;
}) {
  const buyer = await db.user.findUnique({
    where: { id: transaction.userId },
    select: { referredById: true },
  });
  if (!buyer?.referredById) return;

  const existing = await db.referralReward.findUnique({ where: { referredUserId: transaction.userId } });
  if (existing) return;

  const paidCount = await db.transaction.count({
    where: { userId: transaction.userId, status: "SUCCESS" },
  });
  if (paidCount > 1) return; // not their first

  const amountCents = await referralRewardConfig();
  if (amountCents <= 0) return;

  await db.$transaction([
    db.referralReward.create({
      data: {
        earnerId: buyer.referredById,
        referredUserId: transaction.userId,
        transactionId: transaction.id,
        amountCents,
        currency: transaction.currency,
      },
    }),
    db.user.update({ where: { id: buyer.referredById }, data: { creditCents: { increment: amountCents } } }),
    db.notification.create({
      data: {
        userId: buyer.referredById,
        type: "PAYMENT",
        title: "Referral reward",
        body: "Someone you referred made their first purchase. Credit has been added to your account.",
        linkUrl: "/dashboard/referrals",
      },
    }),
  ]);
}

/** How much credit to apply to a purchase (never more than the price). */
export async function creditToApply(userId: string, amountCents: number): Promise<number> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { creditCents: true } });
  return Math.min(user?.creditCents ?? 0, Math.max(0, amountCents));
}

/** Deduct credit that a finalized purchase used. */
export async function settleCreditSpend(userId: string, creditAppliedCents: number) {
  if (creditAppliedCents <= 0) return;
  await db.user.update({
    where: { id: userId },
    data: { creditCents: { decrement: creditAppliedCents } },
  });
}

/** Restore credit when a purchase that used it is refunded. */
export async function restoreCredit(userId: string, creditAppliedCents: number) {
  if (creditAppliedCents <= 0) return;
  await db.user.update({
    where: { id: userId },
    data: { creditCents: { increment: creditAppliedCents } },
  });
}

export async function referralSummary(userId: string) {
  const [user, referredCount, rewards] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { creditCents: true } }),
    db.user.count({ where: { referredById: userId } }),
    db.referralReward.findMany({
      where: { earnerId: userId },
      orderBy: { createdAt: "desc" },
      include: { referredUser: { select: { name: true } } },
    }),
  ]);
  return {
    creditCents: user?.creditCents ?? 0,
    referredCount,
    convertedCount: rewards.length,
    earnedCents: rewards.reduce((s, r) => s + r.amountCents, 0),
    rewards,
  };
}
