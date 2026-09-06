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

export async function assertCanCreateCv(userId: string) {
  if (await hasUnlimitedTools(userId)) return;
  const plan = await resolveActivePlan(userId);
  const limits = (plan?.limits ?? {}) as Record<string, unknown>;
  const limit = typeof limits["cv:count"] === "number" ? (limits["cv:count"] as number) : null;
  if (limit == null || limit < 0) return; // unlimited

  const count = await db.cV.count({ where: { userId, deletedAt: null } });
  if (count >= limit) {
    throw new ApiError(
      403,
      "CV_LIMIT_REACHED",
      `Your ${plan?.name ?? "Free"} plan allows up to ${limit} CV${limit === 1 ? "" : "s"}. Upgrade to create more.`,
    );
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
