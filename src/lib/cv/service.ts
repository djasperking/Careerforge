import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { hasUnlimitedTools } from "@/lib/entitlements";

/** Resolve the caller's active plan, falling back to FREE if they have none. */
export async function resolveActivePlan(userId: string) {
  const sub = await db.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  if (sub) return sub.plan;
  return db.subscriptionPlan.findUnique({ where: { key: "FREE" } });
}

/** Price (minor units) + currency for a one-time single-CV unlock. Configurable
 * from system settings; defaults to ₦1,000. */
export async function cvUnlockPrice(): Promise<{ amountCents: number; currency: string }> {
  const [priceRow, currencyRow] = await Promise.all([
    db.systemSetting.findUnique({ where: { key: "cv.oneTimePriceCents" } }),
    db.systemSetting.findUnique({ where: { key: "cv.oneTimeCurrency" } }),
  ]);
  const amountCents = typeof priceRow?.value === "number" ? priceRow.value : 100_000;
  const currency = typeof currencyRow?.value === "string" ? currencyRow.value : "NGN";
  return { amountCents, currency };
}

/** Whether the user gets un-watermarked output for *this* CV. True if they hold
 * any paid subscription, or they bought a one-time unlock for this CV
 * (`CV.isPremium`). */
export async function cvHasCleanExport(
  userId: string,
  cv: { isPremium?: boolean } | null,
): Promise<boolean> {
  if (cv?.isPremium) return true;
  if (await hasUnlimitedTools(userId)) return true;
  const plan = await resolveActivePlan(userId);
  if (!plan) return false;
  const limits = (plan.limits ?? {}) as Record<string, unknown>;
  if (typeof limits["cv:watermarkExport"] === "boolean") return !limits["cv:watermarkExport"];
  return plan.key !== "FREE";
}

/** Hard ceiling to stop runaway/abuse creation, on top of any plan limit. */
const CV_MAX_PER_USER = 50;

/**
 * The number of CVs this user may keep. Driven by the plan's `cv:count` limit
 * (data, set per plan in Admin → Subscriptions): -1 or missing = unlimited
 * (capped at the abuse ceiling), otherwise that many. Free defaults to 1 so
 * casual users can't burn through AI credit spinning up CV after CV.
 */
export async function cvCountLimit(userId: string): Promise<number> {
  if (await hasUnlimitedTools(userId)) return CV_MAX_PER_USER;
  const plan = await resolveActivePlan(userId);
  const limits = (plan?.limits ?? {}) as Record<string, unknown>;
  const raw = limits["cv:count"];
  if (raw === -1 || raw == null) return CV_MAX_PER_USER;
  if (typeof raw === "number" && raw >= 0) return Math.min(raw, CV_MAX_PER_USER);
  return CV_MAX_PER_USER;
}

export async function assertCanCreateCv(userId: string) {
  if (await hasUnlimitedTools(userId)) return;
  const [count, limit] = await Promise.all([
    db.cV.count({ where: { userId, deletedAt: null } }),
    cvCountLimit(userId),
  ]);
  if (count >= limit) {
    const msg =
      limit <= 1
        ? "Your free plan includes one CV. Subscribe to build more, or delete this one to start over."
        : `You've reached your plan's limit of ${limit} CVs. Upgrade or delete one to make room.`;
    throw new ApiError(429, "TOO_MANY_CVS", msg);
  }
}

export async function assertTemplateAllowed(userId: string, templateId: string | null) {
  if (!templateId) return;
  const template = await db.cVTemplate.findUnique({ where: { id: templateId } });
  if (!template || !template.isActive) {
    throw new ApiError(404, "TEMPLATE_NOT_FOUND", "That template is not available.");
  }
  if (!template.isPremium) return;

  const plan = await resolveActivePlan(userId);
  const limits = (plan?.limits ?? {}) as Record<string, unknown>;
  if (limits["cv:premiumTemplates"] !== true) {
    throw new ApiError(
      403,
      "PREMIUM_TEMPLATE",
      `"${template.name}" is a premium template. Upgrade your plan to use it.`,
    );
  }
}

export async function nextCvVersionNumber(cvId: string) {
  const last = await db.cVVersion.findFirst({ where: { cvId }, orderBy: { version: "desc" } });
  return (last?.version ?? 0) + 1;
}
