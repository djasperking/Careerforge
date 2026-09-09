import { env } from "@/lib/env";
import { sendJobMatchAlerts } from "@/lib/jobs/alerts";

/**
 * "Jobs that match your CV" alert sender. Triggered by Vercel Cron (see
 * vercel.json) with `Authorization: Bearer $CRON_SECRET`. Disabled (503) when
 * CRON_SECRET is unset rather than left open.
 */
export async function GET(req: Request) {
  if (!env.CRON_SECRET) {
    return Response.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = await sendJobMatchAlerts();
  return Response.json({ ok: true, ...result });
}
