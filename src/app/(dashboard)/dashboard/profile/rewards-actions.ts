"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { claimSocialFollow } from "@/lib/rewards/service";
import type { SocialPlatform } from "@prisma/client";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const platformSchema = z.enum(["FACEBOOK", "INSTAGRAM", "TWITTER", "LINKEDIN"]);

export async function claimSocialFollowAction(platform: string): Promise<Result<{ rewardCents: number }>> {
  try {
    const user = await requireUserApi();
    const p = platformSchema.parse(platform) as SocialPlatform;
    const rewardCents = await claimSocialFollow(user.id, p);
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/referrals");
    return { ok: true, data: { rewardCents } };
  } catch (err) {
    return fail(err);
  }
}
