import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";
import type { AIContext, AIResult } from "./types";
import { mockAIProvider } from "./mock";
import { buildJsonProvider } from "./json-provider";
import { getActiveSystemPrompt, type AIFeatureKey } from "./prompts";

const API_KEY = env.GEMINI_API_KEY || "";
const MODEL = env.GEMINI_MODEL;
const BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_BASE = `You are Career Forge's AI assistant. Rules you must never break:
- Never fabricate employment history, job titles, dates, degrees, certifications, licences or achievements.
- Only rephrase, structure, or improve information the user has provided.
- When a suggestion needs the user to confirm a fact, mark it clearly.
- Return ONLY valid JSON matching the requested schema, with no prose around it.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gemini-backed transport. Admins can override the per-feature instruction via
 * AIPrompt; SYSTEM_BASE's safety rules always apply on top.
 */
async function jsonCall<T>(
  ctx: AIContext,
  defaultInstruction: string,
  userPrompt: string,
  schemaHint: string,
  opts: { maxTokens?: number } = {},
): Promise<AIResult<T>> {
  const started = Date.now();
  const custom = await getActiveSystemPrompt(ctx.feature as AIFeatureKey).catch(() => null);
  const system = `${SYSTEM_BASE}\n\n${custom ?? defaultInstruction}\n\nSchema:\n${schemaHint}`;
  const maxOutputTokens = Math.max(opts.maxTokens ?? 0, env.AI_MAX_OUTPUT_TOKENS);

  // Gemini flash returns 429/503 under load — retry a few times before giving up.
  let res: Response | null = null;
  let lastStatus = 0;
  // A stalled connection must not hang the request forever: each attempt gets a
  // time limit, and we stop retrying once we're close to the serverless limit.
  const deadline = started + 50_000;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      res = await fetch(`${BASE}/models/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens, temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(Math.max(5_000, Math.min(25_000, deadline - Date.now()))),
      });
    } catch (err) {
      // Timeout or network error — treat like an overloaded server.
      console.error("gemini request failed", err instanceof Error ? err.message : err);
      res = null;
      lastStatus = 503;
      if (Date.now() >= deadline) break;
      await sleep(700 * 2 ** attempt);
      continue;
    }
    if (res.ok) break;
    lastStatus = res.status;
    if (res.status !== 429 && res.status !== 503 && res.status !== 500) break;
    await sleep(700 * 2 ** attempt); // 0.7s, 1.4s, 2.8s
  }

  if (!res || !res.ok) {
    if (lastStatus === 429 || lastStatus === 503 || lastStatus === 500) {
      throw new ApiError(503, "AI_BUSY", "The AI is busy right now — please try again in a moment.");
    }
    const body = res ? await res.text().catch(() => "") : "";
    throw new ApiError(502, "AI_ERROR", `The AI request failed (${lastStatus}). ${body.slice(0, 160)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const candidate = json.candidates?.[0];
  const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  const start = Math.max(text.indexOf("{"), text.indexOf("["));
  let parsed: T;
  try {
    parsed = JSON.parse(start >= 0 ? text.slice(start) : text) as T;
  } catch {
    if (candidate?.finishReason === "MAX_TOKENS") {
      throw new ApiError(502, "AI_TRUNCATED", "That was too long for the AI to process in one pass — try a shorter version or paste just the key sections.");
    }
    throw new ApiError(502, "AI_BAD_RESPONSE", "The AI response came back incomplete. Please try again.");
  }

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

export const googleAIProvider = API_KEY ? buildJsonProvider("google", jsonCall) : mockAIProvider;
