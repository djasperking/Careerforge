import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendEmail, appUrl } from "@/lib/email";
import { userJobKeywords, rankMatches } from "./matching";

const LOOKBACK_DAYS = 14;
const MAX_USERS_PER_RUN = 500;

/**
 * Send each opted-in job-seeker an email of the newest jobs that match their
 * CV / profile keywords. Only counts jobs posted since we last emailed that
 * person (or the lookback window, whichever is more recent), so nobody gets
 * the same job twice. Safe to run on a schedule.
 */
export async function sendJobMatchAlerts(
  opts: { dryRun?: boolean } = {},
): Promise<{ scanned: number; sent: number; skipped: string }> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
  const now = new Date();

  const jobs = await db.jobPost.findMany({
    where: {
      status: "PUBLISHED",
      postedAt: { gte: since },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    select: {
      id: true, slug: true, title: true, company: true,
      category: true, description: true, salaryText: true, postedAt: true,
    },
    orderBy: { postedAt: "desc" },
  });
  if (jobs.length === 0) return { scanned: 0, sent: 0, skipped: "no jobs posted recently" };

  const users = await db.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      emailVerifiedAt: { not: null },
      jobAlertsOptOut: false,
      cvs: { some: { deletedAt: null } },
    },
    select: { id: true, email: true, name: true, jobAlertsLastSentAt: true, jobAlertsToken: true },
    take: MAX_USERS_PER_RUN,
  });

  let sent = 0;
  for (const user of users) {
    const cutoff = user.jobAlertsLastSentAt && user.jobAlertsLastSentAt > since ? user.jobAlertsLastSentAt : since;
    const freshJobs = jobs.filter((j) => (j.postedAt ?? new Date(0)) > cutoff);
    if (freshJobs.length === 0) continue;

    const keywords = await userJobKeywords(user.id);
    if (keywords.size < 3) continue; // not enough signal to match on

    const matches = rankMatches(keywords, freshJobs).slice(0, 5);
    if (matches.length === 0) continue;

    if (opts.dryRun) {
      sent += 1;
      continue;
    }

    const token = user.jobAlertsToken ?? randomBytes(20).toString("hex");
    if (!user.jobAlertsToken) {
      await db.user.update({ where: { id: user.id }, data: { jobAlertsToken: token } });
    }

    const rows = matches
      .map(
        (m) =>
          `<a href="${appUrl(`/jobs/${m.slug}`)}" style="color:#3446cb;text-decoration:none;font-weight:600;">${escapeHtml(
            m.title,
          )}</a> — ${escapeHtml(m.company)}${m.salaryText ? ` · ${escapeHtml(m.salaryText)}` : ""}`,
      )
      .join("<br>");

    try {
      await sendEmail({
        to: user.email,
        template: "job-matches",
        subject:
          matches.length === 1
            ? `A new job matches your CV: ${matches[0].title}`
            : `${matches.length} new jobs match your CV`,
        data: {
          name: user.name,
          count: matches.length,
          jobsHtml: rows,
          browseUrl: appUrl("/jobs/today"),
          unsubscribeUrl: appUrl(`/api/jobs/alerts/unsubscribe?token=${token}`),
        },
      });
      await db.user.update({ where: { id: user.id }, data: { jobAlertsLastSentAt: now } });
      sent += 1;
    } catch (err) {
      console.error("job-match alert failed for", user.email, err);
    }
  }

  return { scanned: users.length, sent, skipped: "" };
}

function escapeHtml(v: string) {
  return v.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** Turn job alerts off for the holder of this token. Returns false if unknown. */
export async function unsubscribeJobAlerts(token: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { jobAlertsToken: token }, select: { id: true } });
  if (!user) return false;
  await db.user.update({ where: { id: user.id }, data: { jobAlertsOptOut: true } });
  return true;
}
