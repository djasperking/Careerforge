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
}): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("subscriptions:write");
    if (input.name.trim().length < 2) throw new ApiError(422, "INVALID_NAME", "Enter a plan name.");
    await db.subscriptionPlan.update({
      where: { id: planId },
      data: {
        name: input.name.trim(),
        priceCents: Math.max(0, input.priceCents),
        billingPeriod: input.billingPeriod,
        features: input.features.split("\n").map((f) => f.trim()).filter(Boolean),
        isActive: input.isActive,
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
