import { env } from "@/lib/env";
import { runAllSources } from "@/lib/jobs/ingest/run";

// Pulling several sources can take a while.
export const maxDuration = 60;

/**
 * Daily job-ingest agent. Triggered by Vercel Cron (see vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. New roles land as DRAFTs for admin
 * review. Disabled (503) when CRON_SECRET is unset rather than left open.
 */
export async function GET(req: Request) {
  if (!env.CRON_SECRET) {
    return Response.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const results = await runAllSources();
  return Response.json({
    ok: true,
    sources: results.length,
    created: results.reduce((n, r) => n + r.created, 0),
    closed: results.reduce((n, r) => n + r.closed, 0),
    failed: results.filter((r) => r.error).map((r) => ({ source: r.name, error: r.error })),
  });
}
