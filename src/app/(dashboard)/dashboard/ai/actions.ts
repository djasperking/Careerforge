"use server";

import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { withAIUsage } from "@/lib/ai";
import { parseCvContent } from "@/lib/cv/schema";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function askCareerAssistant(input: {
  mode: "career.assistant" | "interview.coach";
  history: ChatMessage[];
  question: string;
}): Promise<Result<{ reply: string }>> {
  try {
    const user = await requireUserApi();
    if (input.question.trim().length < 2) {
      throw new ApiError(422, "EMPTY_QUESTION", "Type a question first.");
    }
    const framedQuestion =
      input.mode === "interview.coach"
        ? `Acting as an interview coach, help with this: ${input.question}`
        : input.question;

    const result = await withAIUsage({ userId: user.id, feature: input.mode }, (provider) =>
      provider.careerAdvice(
        { question: framedQuestion, history: input.history.slice(-10) },
        { userId: user.id, feature: input.mode },
      ),
    );
    return { ok: true, data: { reply: result.data.reply } };
  } catch (err) {
    return fail(err);
  }
}

export async function generateCoverLetterAction(input: {
  cvId: string;
  jobDescription: string;
  tone: string;
}): Promise<Result<{ coverLetter: string }>> {
  try {
    const user = await requireUserApi();
    if (input.jobDescription.trim().length < 20) {
      throw new ApiError(422, "JD_TOO_SHORT", "Paste a fuller job description first.");
    }
    const cv = await db.cV.findFirst({ where: { id: input.cvId, userId: user.id, deletedAt: null } });
    if (!cv) throw new ApiError(404, "NOT_FOUND", "Select one of your CVs first.");

    const result = await withAIUsage({ userId: user.id, feature: "cv.cover_letter" }, (provider) =>
      provider.generateCoverLetter(
        { cv: parseCvContent(cv.content) as never, jobDescription: input.jobDescription, tone: input.tone },
        { userId: user.id, feature: "cv.cover_letter" },
      ),
    );
    return { ok: true, data: { coverLetter: result.data.coverLetter } };
  } catch (err) {
    return fail(err);
  }
}

export async function getCourseRecommendations(): Promise<
  Result<{ courseId: string; title: string; slug: string; reason: string }[]>
> {
  try {
    const user = await requireUserApi();
    const [profile, catalog, enrolledIds] = await Promise.all([
      db.profile.findUnique({ where: { userId: user.id } }),
      db.course.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, title: true, slug: true, objectives: true, category: { select: { name: true } } },
        take: 40,
      }),
      db.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } }),
    ]);

    const enrolled = new Set(enrolledIds.map((e) => e.courseId));
    const available = catalog.filter((c) => !enrolled.has(c.id));
    if (available.length === 0) return { ok: true, data: [] };

    const result = await withAIUsage({ userId: user.id, feature: "course.recommend" }, (provider) =>
      provider.recommendCourses(
        {
          profile: {
            skills: profile?.skills ?? [],
            careerInterests: profile?.careerInterests ?? [],
            headline: profile?.headline ?? "",
          } as never,
          catalog: available.map((c) => ({ id: c.id, title: c.title, tags: [c.category?.name, ...c.objectives].filter(Boolean) as string[] })),
        },
        { userId: user.id, feature: "course.recommend" },
      ),
    );

    const bySlug = new Map(available.map((c) => [c.id, c]));
    return {
      ok: true,
      data: result.data
        .map((r) => {
          const course = bySlug.get(r.courseId);
          return course ? { courseId: course.id, title: course.title, slug: course.slug, reason: r.reason } : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    };
  } catch (err) {
    return fail(err);
  }
}
