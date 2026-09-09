"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { withAIUsage, getCvAIProvider } from "@/lib/ai";
import {
  cvContentSchema, coerceCvContent, emptyCvContent, parseCvContent, scoreCvCompleteness, type CVContent,
} from "@/lib/cv/schema";
import { assertCanCreateCv, assertTemplateAllowed, nextCvVersionNumber } from "@/lib/cv/service";
import { extractCvText } from "@/lib/cv/extract";
import { heuristicParseCv } from "@/lib/cv/heuristic-parse";

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

// ---- Import & tailor -------------------------------------------------

export async function importCvFromUpload(
  formData: FormData,
): Promise<Result<{ id: string; notes: string[] }>> {
  try {
    const user = await requireUserApi();
    await assertCanCreateCv(user.id);

    const file = formData.get("file");
    const pasted = String(formData.get("text") ?? "").trim();
    const jobDescription = String(formData.get("jobDescription") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim().slice(0, 160);

    let rawText = pasted;
    if (file instanceof File && file.size > 0) {
      rawText = await extractCvText(file);
    }
    if (rawText.length < 80) {
      throw new ApiError(422, "NO_CV", "Upload a CV file or paste your current CV text (a few lines at least).");
    }
    if (jobDescription && jobDescription.length < 20) {
      throw new ApiError(422, "JD_TOO_SHORT", "Paste a fuller job description, or leave it blank to just import.");
    }

    // Plain import (just structuring an uploaded CV into fields) is a free
    // utility on every plan and does not count against the AI quota. Only
    // tailoring to a job description goes through the metered path.
    const ctx = { userId: user.id, feature: "cv.import" };

    const provider = await getCvAIProvider(user.id);

    let content: CVContent;
    let notes: string[];
    try {
      const result = jobDescription
        ? await withAIUsage(ctx, (p) => p.importCV({ rawText, targetJobDescription: jobDescription }, ctx), { provider })
        : await provider.importCV({ rawText }, ctx);
      content = coerceCvContent(result.data.content);
      notes = (result.data.tailoringNotes ?? []).map((n) => String(n)).filter(Boolean).slice(0, 12);
    } catch (aiErr) {
      // Never hard-fail an import — if the AI is unavailable, fall back to a
      // local best-effort parse so the user still gets an editable draft.
      console.error("cv import: AI parse failed, using heuristic fallback", aiErr);
      content = coerceCvContent(heuristicParseCv(rawText));
      notes = [
        "The smart importer was busy, so we did a quick automatic pass. Please check every field — names, dates, bullet points and skills — before using this CV.",
        ...(jobDescription ? ["Your tailored details weren't applied. Open the editor and use “Analyze against this job” once things are quieter."] : []),
      ];
    }

    const cv = await db.cV.create({
      data: {
        userId: user.id,
        title: title || (jobDescription ? "Tailored CV" : "Imported CV"),
        content: content as never,
      },
    });
    await db.cVVersion.create({
      data: { cvId: cv.id, version: 1, content: content as never, reason: jobDescription ? "ai import + tailor" : "ai import" },
    });
    await audit({
      actorId: user.id,
      action: "CV_CREATED",
      entity: "CV",
      entityId: cv.id,
      metadata: { via: "import", tailored: !!jobDescription, completeness: scoreCvCompleteness(content) },
    });
    revalidatePath("/dashboard/cvs");
    return { ok: true, data: { id: cv.id, notes } };
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

    const result = await withAIUsage(
      { userId: user.id, feature: "cv.generate" },
      (provider) =>
        provider.generateCV(
          { rawProfile: input.content as never, targetJobDescription: input.targetJobDescription },
          { userId: user.id, feature: "cv.generate" },
        ),
      { provider: await getCvAIProvider(user.id) },
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

    const result = await withAIUsage(
      { userId: user.id, feature: "cv.analyze" },
      (provider) =>
        provider.analyzeCV(
          { cv: input.content as never, jobDescription: input.jobDescription },
          { userId: user.id, feature: "cv.analyze" },
        ),
      { provider: await getCvAIProvider(user.id) },
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
