import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { hasUnlimitedTools } from "@/lib/entitlements";
import { resolveActivePlan } from "@/lib/cv/service";
import type { AIContext, AIProvider, AIResult } from "./types";
import { mockAIProvider } from "./mock";
import { anthropicAIProvider } from "./anthropic";
import { googleAIProvider } from "./google";

export * from "./types";

export function getAIProvider(): AIProvider {
  switch (env.AI_PROVIDER) {
    case "anthropic":
      return anthropicAIProvider;
    case "google":
      return googleAIProvider;
    default:
      return mockAIProvider;
  }
}

/**
 * Provider for the CV tools. Premium/staff get the configured provider (which
 * may be Anthropic); everyone else is pinned to Gemini so free usage can never
 * spend Anthropic credit. Falls back to mock only when no provider is set.
 */
export async function getCvAIProvider(userId: string | undefined): Promise<AIProvider> {
  if (userId) {
    const [staff, plan] = await Promise.all([
      hasUnlimitedTools(userId),
      resolveActivePlan(userId),
    ]);
    const isPaid = staff || (plan != null && plan.key !== "FREE");
    if (isPaid) return getAIProvider();
  }
  // Non-paid: Gemini, or mock if Gemini isn't configured.
  return env.AI_PROVIDER === "google" || env.GEMINI_API_KEY ? googleAIProvider : getAIProvider();
}

/** Current period key, e.g. "2026-09". */
function period(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Enforce the caller's plan limit for a feature, then record usage after the
 * call. Limits live in SubscriptionPlan.limits (data, not code).
 */
export async function withAIUsage<T>(
  ctx: AIContext,
  run: (provider: AIProvider) => Promise<AIResult<T>>,
  opts: { provider?: AIProvider } = {},
): Promise<AIResult<T>> {
  const provider = opts.provider ?? getAIProvider();

  if (ctx.userId && !(await hasUnlimitedTools(ctx.userId))) {
    const limit = await resolveFeatureLimit(ctx.userId, ctx.feature);
    if (limit != null) {
      const used = await db.aIUsage.findUnique({
        where: {
          userId_period_feature: { userId: ctx.userId, period: period(), feature: ctx.feature },
        },
      });
      if ((used?.count ?? 0) >= limit) {
        throw new ApiError(429, "AI_LIMIT_REACHED", "You have reached your plan's AI usage limit for this feature.");
      }
    }
  }

  let result: AIResult<T>;
  try {
    result = await run(provider);
  } catch (err) {
    await db.aIRequest.create({
      data: {
        userId: ctx.userId ?? null,
        feature: ctx.feature,
        provider: provider.name,
        model: env.AI_MODEL,
        status: "error",
        error: (err as Error).message.slice(0, 500),
      },
    });
    throw err;
  }

  await db.aIRequest.create({
    data: {
      userId: ctx.userId ?? null,
      feature: ctx.feature,
      provider: result.meta.provider,
      model: result.meta.model,
      promptTokens: result.meta.promptTokens,
      outputTokens: result.meta.outputTokens,
      latencyMs: result.meta.latencyMs,
      status: "success",
    },
  });

  if (ctx.userId) {
    await db.aIUsage.upsert({
      where: {
        userId_period_feature: { userId: ctx.userId, period: period(), feature: ctx.feature },
      },
      create: {
        userId: ctx.userId,
        period: period(),
        feature: ctx.feature,
        count: 1,
        tokens: result.meta.promptTokens + result.meta.outputTokens,
      },
      update: {
        count: { increment: 1 },
        tokens: { increment: result.meta.promptTokens + result.meta.outputTokens },
      },
    });
  }

  return result;
}

async function resolveFeatureLimit(userId: string, feature: string): Promise<number | null> {
  const sub = await db.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  const limits = (sub?.plan.limits ?? {}) as Record<string, unknown>;
  const perFeature = limits[`ai:${feature}`];
  const global = limits["ai:requestsPerMonth"];
  const value = perFeature ?? global;
  return typeof value === "number" ? value : null;
}
