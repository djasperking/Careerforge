"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { uniqueJobSlug } from "@/lib/jobs/service";
import { appUrl } from "@/lib/email";
import { withAIUsage } from "@/lib/ai";
import { heuristicParseJob } from "@/lib/jobs/parse-posting";
import type { JobImportOutput } from "@/lib/ai/types";

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

// ---- Paste a job posting -------------------------------------------------

const LOCATION_TYPES = ["REMOTE", "HYBRID", "ONSITE"] as const;
const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP"] as const;

function coerceJob(raw: Partial<JobImportOutput>, rawText: string): JobImportOutput {
  const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const locationType = (LOCATION_TYPES as readonly string[]).includes(String(raw.locationType))
    ? (raw.locationType as JobImportOutput["locationType"])
    : "REMOTE";
  const type = (JOB_TYPES as readonly string[]).includes(String(raw.type))
    ? (raw.type as JobImportOutput["type"])
    : "FULL_TIME";
  let description = s(raw.description, 18_000);
  if (description.length < 20) description = rawText.trim().slice(0, 18_000);
  return {
    title: s(raw.title, 160) || "Untitled role",
    company: s(raw.company, 160),
    location: s(raw.location, 160),
    locationType,
    type,
    category: s(raw.category, 80),
    salaryText: s(raw.salaryText, 120),
    description,
  };
}

const importJobSchema = z.object({
  text: z.string().min(40, "Paste the full job posting (a few lines at least)."),
  applyUrl: z.string().url("Enter the application link, e.g. https://…"),
  publish: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export async function importJobFromText(
  input: unknown,
): Promise<Result<{ id: string; slug: string; url: string; usedAI: boolean; published: boolean }>> {
  try {
    const admin = await requirePermissionApi("jobs:write");
    const { text, applyUrl, publish, featured } = importJobSchema.parse(input);

    const ctx = { userId: admin.id, feature: "job.import" };
    let parsed: JobImportOutput;
    let usedAI = true;
    try {
      const r = await withAIUsage(ctx, (p) => p.importJobPosting({ rawText: text }, ctx));
      parsed = coerceJob(r.data, text);
    } catch (aiErr) {
      console.error("job import: AI failed, using heuristic fallback", aiErr);
      parsed = coerceJob(heuristicParseJob(text), text);
      usedAI = false;
    }

    const company = parsed.company || "Employer";
    const slug = await uniqueJobSlug(parsed.title, company);
    const job = await db.jobPost.create({
      data: {
        slug,
        title: parsed.title,
        company,
        companyLogoUrl: null,
        location: parsed.location || null,
        locationType: parsed.locationType,
        type: parsed.type,
        category: parsed.category || null,
        salaryText: parsed.salaryText || null,
        description: parsed.description,
        howToApply: null,
        applyUrl: applyUrl.trim(),
        featured: Boolean(featured),
        status: publish ? "PUBLISHED" : "DRAFT",
        postedAt: publish ? new Date() : null,
        createdById: admin.id,
      },
    });
    await audit({ actorId: admin.id, action: "JOB_CREATED", entity: "JobPost", entityId: job.id, metadata: { via: "paste", published: !!publish } });
    revalidatePath("/admin/jobs");
    revalidatePath("/jobs");
    return { ok: true, data: { id: job.id, slug: job.slug, url: appUrl(`/jobs/${job.slug}`), usedAI, published: !!publish } };
  } catch (err) {
    return fail(err);
  }
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
