import { db } from "@/lib/db";

/**
 * Feature keys used across AIPrompt, AIRequest.feature and AIUsage.feature.
 * Keep this list and the seed's admin UI in sync — it's the whole set of
 * "AI modules" an admin can version prompts for.
 */
export const AI_FEATURE_KEYS = [
  "cv.generate",
  "cv.import",
  "cv.analyze",
  "course.import",
  "exam.generate_questions",
  "exam.grade",
] as const;
export type AIFeatureKey = (typeof AI_FEATURE_KEYS)[number];

export const AI_FEATURE_LABELS: Record<AIFeatureKey, string> = {
  "cv.generate": "CV generator",
  "cv.import": "CV import & tailoring",
  "cv.analyze": "CV analyzer",
  "course.import": "Course outline from a document",
  "exam.generate_questions": "Exam question generator",
  "exam.grade": "Exam explanation / grading",
};

/**
 * The admin-configured, currently-active system prompt for a feature, if any.
 * Providers fall back to their own built-in instructions when nothing is
 * configured — admins only need to touch this to customise tone/behaviour.
 */
export async function getActiveSystemPrompt(key: AIFeatureKey): Promise<string | null> {
  const row = await db.aIPrompt.findFirst({ where: { key, isActive: true }, orderBy: { version: "desc" } });
  return row?.systemPrompt ?? null;
}
