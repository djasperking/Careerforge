"use server";

import { revalidatePath } from "next/cache";
import { requirePermissionApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { revokeSocialFollowClaim } from "@/lib/rewards/service";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function revokeClaimAction(claimId: string): Promise<Result<{ clawedBackCents: number }>> {
  try {
    const admin = await requirePermissionApi("payments:refund");
    const { platform, clawedBackCents } = await revokeSocialFollowClaim(claimId);
    await audit({
      actorId: admin.id,
      action: "SOCIAL_CLAIM_REVOKED",
      entity: "SocialFollowClaim",
      entityId: claimId,
      metadata: { platform, clawedBackCents },
    });
    revalidatePath("/admin/rewards");
    return { ok: true, data: { clawedBackCents } };
  } catch (err) {
    return fail(err);
  }
}
