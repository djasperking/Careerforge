import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";

/**
 * In-memory fixed-window rate limiter. Fine for a single instance / development.
 * Swap the Map for Redis (Upstash) in production — the interface stays the same.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts?: { windowSeconds?: number; max?: number },
) {
  const windowMs = (opts?.windowSeconds ?? env.RATE_LIMIT_WINDOW_SECONDS) * 1000;
  const max = opts?.max ?? env.RATE_LIMIT_MAX_REQUESTS;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { remaining: max - 1 };
  }
  bucket.count += 1;
  if (bucket.count > max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    throw new ApiError(429, "RATE_LIMITED", `Too many requests. Retry in ${retryAfter}s.`, {
      retryAfter,
    });
  }
  return { remaining: max - bucket.count };
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
