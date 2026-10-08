"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { SOURCE_TYPES } from "@/lib/jobs/ingest/source-types";
import { runAllSources, runSource, type SourceRunResult } from "@/lib/jobs/ingest/run";
import type { JobSourceType } from "@prisma/client";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Check the form." };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const TYPES = SOURCE_TYPES.map((t) => t.type) as [JobSourceType, ...JobSourceType[]];

const addSchema = z.object({
  type: z.enum(TYPES),
  name: z.string().trim().min(2, "Give the source a name.").max(80),
  config: z.record(z.string(), z.string().trim().max(300)).default({}),
});

const SLUG_RE = /^[\w.-]+$/;

export async function addJobSource(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const d = addSchema.parse(input);
    const def = SOURCE_TYPES.find((t) => t.type === d.type)!;

    // Keep only the fields this type defines, and validate them.
    const config: Record<string, string> = {};
    for (const f of def.fields) {
      const v = (d.config[f.key] ?? "").trim();
      if (f.required && !v) throw new ApiError(422, "MISSING_FIELD", `${f.label} is required.`);
      if (v) config[f.key] = v;
    }
    if (config.board && !SLUG_RE.test(config.board)) {
      throw new ApiError(422, "BAD_BOARD", "Use just the board name (letters, numbers, - or _), not a full link.");
    }
    if (config.feed) {
      let host = "";
      try {
        const u = new URL(config.feed);
        if (u.protocol !== "https:") throw new Error();
        host = u.hostname;
      } catch {
        throw new ApiError(422, "BAD_FEED", "Enter a full https:// feed URL.");
      }
      if (!host.endsWith("weworkremotely.com")) {
        throw new ApiError(422, "BAD_FEED", "Only We Work Remotely feeds are supported here.");
      }
    }

    const source = await db.jobSource.create({ data: { type: d.type, name: d.name, config } });
    await audit({ actorId: admin.id, action: "JOB_SOURCE_ADDED", entity: "JobSource", entityId: source.id, metadata: { type: d.type } });
    revalidatePath("/admin/jobs/sources");
    return { ok: true, data: { id: source.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function setJobSourceEnabled(id: string, enabled: boolean): Promise<Result> {
  try {
    await requirePermissionApi("jobs:write");
    await db.jobSource.update({ where: { id }, data: { enabled } });
    revalidatePath("/admin/jobs/sources");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteJobSource(id: string): Promise<Result> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    // Jobs it imported stay on the site (sourceId is set null), just no longer auto-managed.
    await db.jobSource.delete({ where: { id } });
    await audit({ actorId: admin.id, action: "JOB_SOURCE_DELETED", entity: "JobSource", entityId: id });
    revalidatePath("/admin/jobs/sources");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function runJobSourceNow(id: string): Promise<Result<SourceRunResult>> {
  try {
    await requirePermissionApi("jobs:write");
    const source = await db.jobSource.findUnique({ where: { id } });
    if (!source) throw new ApiError(404, "NOT_FOUND", "Source not found.");
    const result = await runSource(source);
    revalidatePath("/admin/jobs/sources");
    revalidatePath("/admin/jobs");
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}

export async function runAllJobSourcesNow(): Promise<Result<SourceRunResult[]>> {
  try {
    await requirePermissionApi("jobs:write");
    const results = await runAllSources();
    revalidatePath("/admin/jobs/sources");
    revalidatePath("/admin/jobs");
    return { ok: true, data: results };
  } catch (err) {
    return fail(err);
  }
}

/** Publish or discard a batch of imported drafts from the review page. */
export async function reviewImportedJobs(ids: string[], action: "publish" | "discard"): Promise<Result<{ count: number }>> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const list = z.array(z.string()).min(1, "Select at least one job.").max(200).parse(ids);
    const where = { id: { in: list }, status: "DRAFT" as const, sourceId: { not: null } };
    const res =
      action === "publish"
        ? await db.jobPost.updateMany({
            where,
            // Imported roles expire after 30 days as a safety net, in case their
            // source is paused or stops listing them.
            data: { status: "PUBLISHED", postedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 86_400_000) },
          })
        : await db.jobPost.updateMany({ where, data: { status: "CLOSED" } });
    await audit({
      actorId: admin.id,
      action: action === "publish" ? "JOB_IMPORT_PUBLISHED" : "JOB_IMPORT_DISCARDED",
      entity: "JobPost",
      metadata: { count: res.count },
    });
    revalidatePath("/admin/jobs");
    revalidatePath("/admin/jobs/review");
    revalidatePath("/jobs");
    return { ok: true, data: { count: res.count } };
  } catch (err) {
    return fail(err);
  }
}
