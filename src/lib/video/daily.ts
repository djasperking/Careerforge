import { env } from "@/lib/env";

/**
 * Daily.co room creation — used to auto-generate a video-call link for a
 * cohort session or coaching booking when the instructor/coach doesn't paste
 * one of their own. Requires DAILY_API_KEY; when unset, callers should fall
 * back to leaving the link blank (nothing here is a required dependency).
 */
export function dailyIsConfigured(): boolean {
  return Boolean(env.DAILY_API_KEY);
}

/**
 * Create a Daily.co room and return its join URL, or null if Daily isn't
 * configured or the request fails (callers treat that as "no auto link").
 */
export async function createDailyRoom(opts: {
  /** Used as a name prefix; Daily requires [a-zA-Z0-9_-], max ~40 chars. */
  name: string;
  /** When the room should stop being joinable. */
  expiresAt?: Date;
  /** Room capacity hint (Daily enforces plan limits regardless). */
  maxParticipants?: number;
}): Promise<string | null> {
  if (!env.DAILY_API_KEY) return null;

  const slug = `${opts.name.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;
  const exp = opts.expiresAt
    ? Math.floor(opts.expiresAt.getTime() / 1000)
    : Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // default: 30-day expiry

  try {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: slug,
        privacy: "public",
        properties: {
          exp,
          enable_screenshare: true,
          enable_chat: true,
          ...(opts.maxParticipants ? { max_participants: opts.maxParticipants } : {}),
        },
      }),
    });
    if (!res.ok) {
      console.error("Daily.co room creation failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch (err) {
    console.error("Daily.co room creation error", err);
    return null;
  }
}
