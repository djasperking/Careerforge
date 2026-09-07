import { env } from "@/lib/env";
import { sendWeeklyDigest } from "@/lib/newsletter/service";

/**
 * Weekly digest sender. Triggered by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`. If CRON_SECRET is unset the endpoint is
 * disabled (returns 503) rather than open.
 */
export async function GET(req: Request) {
  if (!env.CRON_SECRET) {
    return Response.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await sendWeeklyDigest();
  return Response.json({ ok: true, ...result });
}
