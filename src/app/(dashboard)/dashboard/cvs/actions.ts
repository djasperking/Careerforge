"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { withAIUsage } from "@/lib/ai";
import {
  cvContentSchema, emptyCvContent, parseCvContent, type CVContent,
} from "@/lib/cv/schema";
import { assertCanCreateCv, assertTemplateAllowed, nextCvVersionNumber } from "@/lib/cv/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function createCv(templateId: string | null): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUserApi();
    await assertCanCreateCv(user.id);
    await assertTemplateAllowed(user.id, templateId);

    const cv = await db.cV.create({
      data: {
        userId: user.id,
        templateId: templateId ?? undefined,
        title: "Untitled CV",
        content: emptyCvContent() as never,
      },
    });
    await audit({ actorId: user.id, action: "CV_CREATED", entity: "CV", entityId: cv.id });
    revalidatePath("/dashboard/cvs");
    return { ok: true, data: { id: cv.id } };
  } catch (err) {
    return fail(err);
  }
}

async function loadOwnedCv(userId: string, cvId: string) {
  const cv = await db.cV.findFirst({ where: { id: cvId, userId, deletedAt: null } });
  if (!cv) throw new ApiError(404, "NOT_FOUND", "CV not found.");
  return cv;
}

export async function saveCv(input: {
  cvId: string;
  title: string;
  templateId: string | null;
  content: CVContent;
  reason?: string;
}): Promise<Result<{ version: number }>> {
  try {
    const user = await requireUserApi();
    await loadOwnedCv(user.id, input.cvId);
    await assertTemplateAllowed(user.id, input.templateId);
    const content = cvContentSchema.parse(input.content);
    const version = await nextCvVersionNumber(input.cvId);

    await db.$transaction([
      db.cV.update({
        where: { id: input.cvId },
        data: {
          title: input.title.trim().slice(0, 160) || "Untitled CV",
          templateId: input.templateId ?? undefined,
          content: content as never,
        },
      }),
      db.cVVersion.create({
        data: { cvId: input.cvId, version, content: content as never, reason: input.reason ?? "manual save" },
      }),
    ]);

    if (input.reason?.startsWith("ai")) {
      await audit({ actorId: user.id, action: "CV_AI_CONTENT_ACCEPTED", entity: "CV", entityId: input.cvId });
    }
    revalidatePath(`/dashboard/cvs/${input.cvId}`);
    revalidatePath("/dashboard/cvs");
    return { ok: true, data: { version } };
  } catch (err) {
    return fail(err);
  }
}

export async function renameCv(cvId: string, title: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await loadOwnedCv(user.id, cvId);
    await db.cV.update({ where: { id: cvId }, data: { title: title.trim().slice(0, 160) || "Untitled CV" } });
    revalidatePath("/dashboard/cvs");
    revalidatePath(`/dashboard/cvs/${cvId}`);
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function duplicateCv(cvId: string): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUserApi();
    const source = await loadOwnedCv(user.id, cvId);
    await assertCanCreateCv(user.id);

    const copy = await db.cV.create({
      data: {
        userId: user.id,
        templateId: source.templateId,
        title: `${source.title} (copy)`,
        content: source.content as never,
      },
    });
    await audit({ actorId: user.id, action: "CV_DUPLICATED", entity: "CV", entityId: copy.id, metadata: { from: cvId } });
    revalidatePath("/dashboard/cvs");
    return { ok: true, data: { id: copy.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCv(cvId: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await loadOwnedCv(user.id, cvId);
    await db.cV.update({ where: { id: cvId }, data: { deletedAt: new Date() } });
    await audit({ actorId: user.id, action: "CV_DELETED", entity: "CV", entityId: cvId });
    revalidatePath("/dashboard/cvs");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function restoreCvVersion(cvId: string, version: number): Promise<Result<{ content: CVContent }>> {
  try {
    const user = await requireUserApi();
    await loadOwnedCv(user.id, cvId);
    const snapshot = await db.cVVersion.findUnique({ where: { cvId_version: { cvId, version } } });
    if (!snapshot) throw new ApiError(404, "NOT_FOUND", "That version no longer exists.");
    const content = parseCvContent(snapshot.content);

    const nextVersion = await nextCvVersionNumber(cvId);
    await db.$transaction([
      db.cV.update({ where: { id: cvId }, data: { content: content as never } }),
      db.cVVersion.create({
        data: { cvId, version: nextVersion, content: content as never, reason: `restored v${version}` },
      }),
    ]);
    revalidatePath(`/dashboard/cvs/${cvId}`);
    return { ok: true, data: { content } };
  } catch (err) {
    return fail(err);
  }
}

// ---- AI ---------------------------------------------------------------

export async function generateCvSummaryWithAI(input: {
  cvId: string;
  content: CVContent;
  targetJobDescription?: string;
}): Promise<Result<{ professionalSummary: string }>> {
  try {
    const user = await requireUserApi();
    await loadOwnedCv(user.id, input.cvId);

    const result = await withAIUsage({ userId: user.id, feature: "cv.generate" }, (provider) =>
      provider.generateCV(
        { rawProfile: input.content as never, targetJobDescription: input.targetJobDescription },
        { userId: user.id, feature: "cv.generate" },
      ),
    );
    const summary = String((result.data as Record<string, unknown>).professionalSummary ?? "");
    return { ok: true, data: { professionalSummary: summary } };
  } catch (err) {
    return fail(err);
  }
}

export async function analyzeCvAgainstJob(input: {
  cvId: string;
  content: CVContent;
  jobDescription: string;
}): Promise<Result<{
  matchScore: number;
  missingKeywords: string[];
  missingSkills: string[];
  weakSections: string[];
  suggestions: { section: string; suggestion: string; requiresVerification: boolean }[];
  atsRecommendations: string[];
  improvedSummary: string;
}>> {
  try {
    const user = await requireUserApi();
    await loadOwnedCv(user.id, input.cvId);
    if (input.jobDescription.trim().length < 20) {
      throw new ApiError(422, "JD_TOO_SHORT", "Paste a fuller job description (at least a few sentences).");
    }

    const result = await withAIUsage({ userId: user.id, feature: "cv.analyze" }, (provider) =>
      provider.analyzeCV(
        { cv: input.content as never, jobDescription: input.jobDescription },
        { userId: user.id, feature: "cv.analyze" },
      ),
    );

    await db.cVAnalysis.create({
      data: {
        cvId: input.cvId,
        jobDescription: input.jobDescription,
        matchScore: result.data.matchScore,
        missingKeywords: result.data.missingKeywords,
        missingSkills: result.data.missingSkills,
        weakSections: result.data.weakSections,
        suggestions: result.data.suggestions as never,
        atsRecommendations: result.data.atsRecommendations as never,
        improvedSummary: result.data.improvedSummary,
      },
    });

    return { ok: true, data: result.data };
  } catch (err) {
    return fail(err);
  }
}
