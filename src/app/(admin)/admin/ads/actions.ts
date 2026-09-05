"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { PLACEMENTS } from "@/lib/ads/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createCampaign(input: { name: string; advertiser: string }): Promise<Result<{ id: string }>> {
  try {
    const admin = await requirePermissionApi("ads:write");
    if (input.name.trim().length < 2) throw new ApiError(422, "INVALID_NAME", "Enter a campaign name.");
    const campaign = await db.adCampaign.create({ data: { name: input.name, advertiser: input.advertiser || "In-house" } });
    await audit({ actorId: admin.id, action: "AD_CAMPAIGN_CREATED", entity: "AdCampaign", entityId: campaign.id });
    revalidatePath("/admin/ads");
    return { ok: true, data: { id: campaign.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function setCampaignStatus(id: string, status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED"): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("ads:write");
    await db.adCampaign.update({ where: { id }, data: { status } });
    await audit({ actorId: admin.id, action: `AD_CAMPAIGN_${status}`, entity: "AdCampaign", entityId: id });
    revalidatePath("/admin/ads");
    revalidatePath(`/admin/ads/${id}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function createAd(campaignId: string, input: {
  title: string;
  description: string;
  imageUrl: string;
  destinationUrl: string;
  placement: string;
  priority: number;
  maxImpressions: number | null;
  maxClicks: number | null;
}): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("ads:write");
    if (input.title.trim().length < 2) throw new ApiError(422, "INVALID_TITLE", "Enter an ad title.");
    if (!input.destinationUrl.trim()) throw new ApiError(422, "INVALID_URL", "Enter a destination URL.");
    if (!(PLACEMENTS as readonly string[]).includes(input.placement)) throw new ApiError(422, "INVALID_PLACEMENT", "Pick a valid placement.");

    await db.advertisement.create({
      data: {
        campaignId,
        title: input.title,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        destinationUrl: input.destinationUrl,
        placement: input.placement,
        priority: input.priority,
        maxImpressions: input.maxImpressions,
        maxClicks: input.maxClicks,
      },
    });
    await audit({ actorId: admin.id, action: "AD_CREATED", entity: "AdCampaign", entityId: campaignId });
    revalidatePath(`/admin/ads/${campaignId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setAdStatus(adId: string, campaignId: string, status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED"): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("ads:write");
    await db.advertisement.update({ where: { id: adId }, data: { status } });
    await audit({ actorId: admin.id, action: `AD_${status}`, entity: "Advertisement", entityId: adId });
    revalidatePath(`/admin/ads/${campaignId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteAd(adId: string, campaignId: string): Promise<Result<null>> {
  try {
    const admin = await requirePermissionApi("ads:write");
    await db.advertisement.delete({ where: { id: adId } });
    await audit({ actorId: admin.id, action: "AD_DELETED", entity: "Advertisement", entityId: adId });
    revalidatePath(`/admin/ads/${campaignId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
