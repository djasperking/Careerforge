"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Check your selection." };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const ids = z.array(z.string()).min(1, "Select at least one job.").max(200);

function refresh() {
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/jobs/clips");
  revalidatePath("/admin/jobs/crawler");
  revalidatePath("/jobs");
}

/** Publish clipped drafts. They expire after 60 days as a safety net. */
export async function publishClips(input: string[]): Promise<Result<{ count: number }>> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const list = ids.parse(input);
    const res = await db.jobPost.updateMany({
      where: { id: { in: list }, origin: "CLIP", status: "DRAFT" },
      data: { status: "PUBLISHED", postedAt: new Date(), expiresAt: new Date(Date.now() + 60 * 86_400_000) },
    });
    await audit({ actorId: admin.id, action: "CLIPPED_JOBS_PUBLISHED", entity: "JobPost", metadata: { count: res.count } });
    refresh();
    return { ok: true, data: { count: res.count } };
  } catch (err) {
    return fail(err);
  }
}

/** Take a published clipped job back to the waiting list. */
export async function unpublishClip(id: string): Promise<Result> {
  try {
    await requirePermissionApi("jobs:write");
    await db.jobPost.updateMany({ where: { id, origin: "CLIP", status: "PUBLISHED" }, data: { status: "DRAFT" } });
    refresh();
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

/** Delete clipped jobs for good (waiting or published). */
export async function deleteClips(input: string[]): Promise<Result<{ count: number }>> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const list = ids.parse(input);
    const res = await db.jobPost.deleteMany({ where: { id: { in: list }, origin: "CLIP" } });
    await audit({ actorId: admin.id, action: "CLIPPED_JOBS_DELETED", entity: "JobPost", metadata: { count: res.count } });
    refresh();
    return { ok: true, data: { count: res.count } };
  } catch (err) {
    return fail(err);
  }
}

/** Remove every job the (now removed) crawler imported — waiting and live. */
export async function clearCrawlerJobs(): Promise<Result<{ count: number }>> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const res = await db.jobPost.deleteMany({ where: { origin: "CRAWLER" } });
    await audit({ actorId: admin.id, action: "CRAWLER_JOBS_CLEARED", entity: "JobPost", metadata: { count: res.count } });
    refresh();
    return { ok: true, data: { count: res.count } };
  } catch (err) {
    return fail(err);
  }
}
