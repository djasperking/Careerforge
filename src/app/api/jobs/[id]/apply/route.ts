import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { clientIp } from "@/lib/rate-limit";
import { recordApplyClick } from "@/lib/jobs/service";
import { appUrl } from "@/lib/email";

/**
 * Records the click, then forwards the applicant to the employer's application
 * page. No referral links are in use as of 2026-09 (confirmed with the site
 * owner) — the on-page disclosure was removed accordingly. If that changes,
 * re-add a disclosure on the job detail page (and update
 * src/lib/legal/content.ts, which still promises one).
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const job = await db.jobPost.findUnique({ where: { id } });
  if (!job || job.status !== "PUBLISHED") {
    return Response.redirect(appUrl("/jobs"), 302);
  }

  const user = await getCurrentUser().catch(() => null);
  await recordApplyClick(id, user?.id ?? null, clientIp(new Headers(req.headers)));

  let target: URL;
  try {
    target = new URL(job.applyUrl);
    if (target.protocol !== "https:" && target.protocol !== "http:") throw new Error("bad protocol");
  } catch {
    return Response.redirect(appUrl(`/jobs/${job.slug}`), 302);
  }
  return Response.redirect(target.toString(), 302);
}
