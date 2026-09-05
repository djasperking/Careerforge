import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";

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

/**
 * Whether the user gets un-watermarked CV output (preview + PDF). Any paid plan
 * qualifies; the FREE plan (or no subscription) does not. Driven by the plan's
 * `cv:watermarkExport` limit so it stays configurable from the admin plan editor.
 */
export async function hasCleanCvExport(userId: string): Promise<boolean> {
  const plan = await resolveActivePlan(userId);
  if (!plan) return false;
  const limits = (plan.limits ?? {}) as Record<string, unknown>;
  if (typeof limits["cv:watermarkExport"] === "boolean") return !limits["cv:watermarkExport"];
  return plan.key !== "FREE";
}

export async function assertCanCreateCv(userId: string) {
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
