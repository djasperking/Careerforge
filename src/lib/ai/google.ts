import { env } from "@/lib/env";
import type { AIContext, AIProvider, AIResult } from "./types";
import { mockAIProvider } from "./mock";
import { getActiveSystemPrompt, type AIFeatureKey } from "./prompts";

const API_KEY = env.GEMINI_API_KEY || "";
const MODEL = env.GEMINI_MODEL;
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_BASE = `You are Career Forge's AI assistant. Rules you must never break:
- Never fabricate employment history, job titles, dates, degrees, certifications, licences or achievements.
- Only rephrase, structure, or improve information the user has provided.
- When a suggestion needs the user to confirm a fact, mark it clearly.
- Return ONLY valid JSON matching the requested schema, with no prose around it.`;

/**
 * Gemini-backed provider. Mirrors the Anthropic provider: admins can override
 * the per-feature instruction via AIPrompt; SYSTEM_BASE's safety rules always
 * apply on top. Any method without a real prompt — and every method when
 * GEMINI_API_KEY is unset — falls back to the deterministic mock.
 */
async function jsonCall<T>(
  ctx: AIContext,
  defaultInstruction: string,
  userPrompt: string,
  schemaHint: string,
): Promise<AIResult<T>> {
  const started = Date.now();
  const custom = await getActiveSystemPrompt(ctx.feature as AIFeatureKey).catch(() => null);
  const system = `${SYSTEM_BASE}\n\n${custom ?? defaultInstruction}\n\nSchema:\n${schemaHint}`;

  const res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  const start = Math.max(text.indexOf("{"), text.indexOf("["));
  const parsed = JSON.parse(start >= 0 ? text.slice(start) : text) as T;

  return {
    data: parsed,
    meta: {
      provider: "google",
      model: MODEL,
      promptTokens: json.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
      latencyMs: Date.now() - started,
      isAIGenerated: true,
    },
  };
}

export const googleAIProvider: AIProvider = {
  ...mockAIProvider,
  name: API_KEY ? "google" : "mock",

  async generateCV(input, ctx) {
    if (!API_KEY) return mockAIProvider.generateCV(input, ctx);
    const result = await jsonCall<{ professionalSummary: string }>(
      ctx,
      "Write a professional summary for this CV: 2-4 sentences, first-person implied (no 'I'), " +
        "specific to the person's actual roles, industries and skills. Use ONLY facts present in " +
        "the CV data — never invent employers, titles, dates, metrics or achievements. If the CV " +
        "is sparse, keep the summary short rather than padding it with invented detail. If a target " +
        "job description is given, orient the emphasis toward it without claiming unproven experience.",
      `CV data:\n${JSON.stringify(input.rawProfile)}` +
        (input.targetJobDescription ? `\n\nTarget job description:\n${input.targetJobDescription}` : ""),
      `{ professionalSummary: string }`,
    );
    return {
      data: { ...(input.rawProfile as Record<string, unknown>), professionalSummary: result.data.professionalSummary },
      meta: result.meta,
    };
  },

  async analyzeCV(input, ctx) {
    if (!API_KEY) return mockAIProvider.analyzeCV(input, ctx);
    return jsonCall(
      ctx,
      "Analyse the CV against the job description and identify concrete, actionable gaps.",
      `CV:\n${JSON.stringify(input.cv)}\n\nJob description:\n${input.jobDescription}`,
      `{ matchScore:number, missingKeywords:string[], missingSkills:string[], weakSections:string[], suggestions:[{section:string,suggestion:string,requiresVerification:boolean}], atsRecommendations:string[], improvedSummary:string }`,
    );
  },

  async generateCoverLetter(input, ctx) {
    if (!API_KEY) return mockAIProvider.generateCoverLetter(input, ctx);
    return jsonCall(
      ctx,
      "Write a concise, specific cover letter using ONLY facts present in the CV — never invent employers, titles or achievements.",
      `CV:\n${JSON.stringify(input.cv)}\n\nJob description:\n${input.jobDescription}\nTone: ${input.tone ?? "professional"}`,
      `{ coverLetter:string }`,
    );
  },

  async careerAdvice(input, ctx) {
    if (!API_KEY) return mockAIProvider.careerAdvice(input, ctx);
    return jsonCall(
      ctx,
      "Give specific, actionable career guidance in a warm, direct tone. Ask a clarifying question only when truly necessary.",
      `Conversation so far:\n${JSON.stringify(input.history ?? [])}\n\nUser question: ${input.question}`,
      `{ reply:string }`,
    );
  },

  async generateQuestions(input, ctx) {
    if (!API_KEY) return mockAIProvider.generateQuestions(input, ctx);
    return jsonCall(
      ctx,
      "Generate fair, unambiguous exam questions with exactly one best answer (unless multiple-answer) and a clear explanation.",
      `Generate ${input.count} ${input.difficulty} ${input.type} questions on "${input.topic}"${input.courseTitle ? ` for the course "${input.courseTitle}"` : ""}.`,
      `[{ prompt:string, options:[{text:string,isCorrect:boolean}], correctAnswerText?:string, explanation:string, difficulty:string, topic:string }]`,
    );
  },
};
