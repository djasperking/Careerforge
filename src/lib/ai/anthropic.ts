import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";
import type { AIContext, AIResult } from "./types";
import { mockAIProvider } from "./mock";
import { buildJsonProvider } from "./json-provider";
import { getActiveSystemPrompt, type AIFeatureKey } from "./prompts";

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

const SYSTEM_BASE = `You are Career Forge's AI assistant. Rules you must never break:
- Never fabricate employment history, job titles, dates, degrees, certifications, licences or achievements.
- Only rephrase, structure, or improve information the user has provided.
- When a suggestion needs the user to confirm a fact, mark it clearly.
- Return ONLY valid JSON matching the requested schema, with no prose around it.`;

/**
 * Anthropic transport. Admins can override the feature-specific instruction via
 * AIPrompt (src/lib/ai/prompts.ts); SYSTEM_BASE's safety rules always apply on top.
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
  const res = await client!.messages.create({
    model: env.AI_MODEL,
    max_tokens: Math.max(opts.maxTokens ?? 0, env.AI_MAX_OUTPUT_TOKENS),
    system: `${SYSTEM_BASE}\n\n${custom ?? defaultInstruction}\n\nSchema:\n${schemaHint}`,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const start = Math.max(text.indexOf("{"), text.indexOf("["));
  let parsed: T;
  try {
    parsed = JSON.parse(start >= 0 ? text.slice(start) : text) as T;
  } catch {
    if (res.stop_reason === "max_tokens") {
      throw new ApiError(502, "AI_TRUNCATED", "That was too long for the AI to process in one pass — try a shorter version or paste just the key sections.");
    }
    throw new ApiError(502, "AI_BAD_RESPONSE", "The AI response came back incomplete. Please try again.");
  }
  return {
    data: parsed,
    meta: {
      provider: "anthropic",
      model: env.AI_MODEL,
      promptTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      latencyMs: Date.now() - started,
      isAIGenerated: true,
    },
  };
}

export const anthropicAIProvider = client ? buildJsonProvider("anthropic", jsonCall) : mockAIProvider;
