"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function updatePlan(planId: string, input: {
  name: string;
  priceCents: number;
  billingPeriod: string;
  features: string;
  isActive: boolean;
  limits?: Record<string, unknown>;
}): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("subscriptions:write");
    if (input.name.trim().length < 2) throw new ApiError(422, "INVALID_NAME", "Enter a plan name.");

    const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new ApiError(404, "NOT_FOUND", "Plan not found.");

    let limits = (plan.limits ?? {}) as Record<string, unknown>;
    if (input.limits) {
      const cvCount = Number(input.limits["cv:count"]);
      const ai = Number(input.limits["ai:requestsPerMonth"]);
      limits = {
        ...limits,
        "cv:count": cvCount === -1 ? -1 : Math.max(0, Number.isFinite(cvCount) ? cvCount : 1),
        "ai:requestsPerMonth": Math.max(0, Number.isFinite(ai) ? ai : 15),
        "cv:premiumTemplates": input.limits["cv:premiumTemplates"] === true,
      };
    }

    await db.subscriptionPlan.update({
      where: { id: planId },
      data: {
        name: input.name.trim(),
        priceCents: Math.max(0, input.priceCents),
        billingPeriod: input.billingPeriod,
        features: input.features.split("\n").map((f) => f.trim()).filter(Boolean),
        isActive: input.isActive,
        limits: limits as never,
      },
    });
    await audit({ actorId: admin.id, action: "SUBSCRIPTION_PLAN_UPDATED", entity: "SubscriptionPlan", entityId: planId });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/dashboard/payments");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
