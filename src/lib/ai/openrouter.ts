import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";
import type { AIContext, AIResult } from "./types";
import { mockAIProvider } from "./mock";
import { buildJsonProvider } from "./json-provider";
import { getActiveSystemPrompt, type AIFeatureKey } from "./prompts";

/**
 * OpenRouter transport — an OpenAI-compatible gateway that fronts Claude (and
 * many other models). Use this when a direct Anthropic account isn't an option:
 * OpenRouter accepts more payment methods. Set OPENROUTER_API_KEY, optionally
 * OPENROUTER_MODEL (any slug from openrouter.ai/models, e.g.
 * "anthropic/claude-3.5-sonnet"), and AI_PROVIDER=openrouter.
 */

const API_KEY = env.OPENROUTER_API_KEY || "";
const MODEL = env.OPENROUTER_MODEL;
const URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_BASE = `You are Career Forge's AI assistant. Rules you must never break:
- Never fabricate employment history, job titles, dates, degrees, certifications, licences or achievements.
- Only rephrase, structure, or improve information the user has provided.
- When a suggestion needs the user to confirm a fact, mark it clearly.
- Return ONLY valid JSON matching the requested schema, with no prose around it.`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const maxTokens = Math.max(opts.maxTokens ?? 0, env.AI_MAX_OUTPUT_TOKENS);

  let res: Response | null = null;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
        "X-Title": "Career Forge",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
    });
    if (res.ok) break;
    lastStatus = res.status;
    if (res.status !== 429 && res.status !== 502 && res.status !== 503 && res.status !== 529) break;
    await sleep(700 * 2 ** attempt);
  }

  if (!res || !res.ok) {
    if ([429, 502, 503, 529].includes(lastStatus)) {
      throw new ApiError(503, "AI_BUSY", "The AI is busy right now — please try again in a moment.");
    }
    const body = res ? await res.text().catch(() => "") : "";
    throw new ApiError(502, "AI_ERROR", `The AI request failed (${lastStatus}). ${body.slice(0, 160)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const choice = json.choices?.[0];
  const text = choice?.message?.content ?? "";
  const start = Math.max(text.indexOf("{"), text.indexOf("["));
  let parsed: T;
  try {
    parsed = JSON.parse(start >= 0 ? text.slice(start) : text) as T;
  } catch {
    if (choice?.finish_reason === "length") {
      throw new ApiError(502, "AI_TRUNCATED", "That was too long for the AI to process in one pass — try a shorter version or paste just the key sections.");
    }
    throw new ApiError(502, "AI_BAD_RESPONSE", "The AI response came back incomplete. Please try again.");
  }

  return {
    data: parsed,
    meta: {
      provider: "openrouter",
      model: MODEL,
      promptTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - started,
      isAIGenerated: true,
    },
  };
}

export const openrouterAIProvider = API_KEY ? buildJsonProvider("openrouter", jsonCall) : mockAIProvider;
