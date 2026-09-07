"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { uniqueJobSlug } from "@/lib/jobs/service";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Check the form." };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const jobSchema = z.object({
  title: z.string().min(3).max(160),
  company: z.string().min(2).max(160),
  companyLogoUrl: z.string().url().or(z.literal("")).optional(),
  location: z.string().max(160).optional(),
  locationType: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"]),
  category: z.string().max(80).optional(),
  salaryText: z.string().max(120).optional(),
  description: z.string().min(20).max(20_000),
  howToApply: z.string().max(10_000).optional(),
  applyUrl: z.string().url("Enter the full application URL (https://…)."),
  featured: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

function toData(d: z.infer<typeof jobSchema>) {
  return {
    title: d.title.trim(),
    company: d.company.trim(),
    companyLogoUrl: d.companyLogoUrl || null,
    location: d.location?.trim() || null,
    locationType: d.locationType,
    type: d.type,
    category: d.category?.trim() || null,
    salaryText: d.salaryText?.trim() || null,
    description: d.description.trim(),
    howToApply: d.howToApply?.trim() || null,
    applyUrl: d.applyUrl.trim(),
    featured: Boolean(d.featured),
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
  };
}

export async function createJob(input: unknown): Promise<Result<{ id: string }>> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const d = jobSchema.parse(input);
    const data = toData(d);
    const slug = await uniqueJobSlug(data.title, data.company);
    const job = await db.jobPost.create({ data: { ...data, slug, createdById: admin.id } });
    await audit({ actorId: admin.id, action: "JOB_CREATED", entity: "JobPost", entityId: job.id });
    revalidatePath("/admin/jobs");
    return { ok: true, data: { id: job.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateJob(id: string, input: unknown): Promise<Result> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const d = jobSchema.parse(input);
    await db.jobPost.update({ where: { id }, data: toData(d) });
    await audit({ actorId: admin.id, action: "JOB_UPDATED", entity: "JobPost", entityId: id });
    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${id}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setJobStatus(id: string, status: "DRAFT" | "PUBLISHED" | "CLOSED"): Promise<Result> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const job = await db.jobPost.findUnique({ where: { id } });
    if (!job) throw new ApiError(404, "NOT_FOUND", "Job not found.");
    await db.jobPost.update({
      where: { id },
      data: { status, postedAt: status === "PUBLISHED" && !job.postedAt ? new Date() : job.postedAt },
    });
    await audit({ actorId: admin.id, action: "JOB_STATUS", entity: "JobPost", entityId: id, metadata: { status } });
    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${id}`);
    revalidatePath("/jobs");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteJob(id: string): Promise<Result> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    await db.jobPost.delete({ where: { id } });
    await audit({ actorId: admin.id, action: "JOB_DELETED", entity: "JobPost", entityId: id });
    revalidatePath("/admin/jobs");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
