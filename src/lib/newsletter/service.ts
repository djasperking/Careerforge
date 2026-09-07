import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { sendEmail, appUrl } from "@/lib/email";
import { listPublicJobs } from "@/lib/jobs/service";
import { listPublishedPosts } from "@/lib/blog/service";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function subscribe(rawEmail: string, source?: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new ApiError(422, "BAD_EMAIL", "Enter a valid email address.");

  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    if (existing.status === "UNSUBSCRIBED") {
      await db.newsletterSubscriber.update({
        where: { email },
        data: { status: "SUBSCRIBED", unsubscribedAt: null },
      });
    }
    return { already: true };
  }

  await db.newsletterSubscriber.create({
    data: { email, token: randomBytes(20).toString("hex"), source: source?.slice(0, 40) || null },
  });
  return { already: false };
}

export async function unsubscribeByToken(token: string) {
  const sub = await db.newsletterSubscriber.findUnique({ where: { token } });
  if (!sub) return false;
  if (sub.status !== "UNSUBSCRIBED") {
    await db.newsletterSubscriber.update({
      where: { token },
      data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    });
  }
  return true;
}

export async function subscriberCounts() {
  const [subscribed, total] = await Promise.all([
    db.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
    db.newsletterSubscriber.count(),
  ]);
  return { subscribed, total };
}

/** Build the digest body sections (HTML strings) from the last 7 days. */
export async function buildDigest() {
  const [jobs, posts, courses] = await Promise.all([
    listPublicJobs().then((j) => j.slice(0, 5)),
    listPublishedPosts({ take: 3 }),
    db.course.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  const link = (href: string, text: string) =>
    `<a href="${appUrl(href)}" style="color:#3446cb;text-decoration:none;">${text}</a>`;
  const sections: string[] = [];

  if (jobs.length) {
    sections.push(
      `<strong>New jobs</strong><br>` +
        jobs.map((j) => `${link(`/jobs/${j.slug}`, j.title)} — ${j.company}`).join("<br>"),
    );
  }
  if (posts.length) {
    sections.push(
      `<strong>From the blog</strong><br>` +
        posts.map((p) => link(`/blog/${p.slug}`, p.title)).join("<br>"),
    );
  }
  if (courses.length) {
    sections.push(
      `<strong>New courses</strong><br>` +
        courses.map((c) => link(`/courses/${c.slug}`, c.title)).join("<br>"),
    );
  }

  return { sections, counts: { jobs: jobs.length, posts: posts.length, courses: courses.length } };
}

/**
 * Send the weekly digest to every subscribed address. Skips send entirely if
 * there's nothing new. Returns how many were emailed.
 */
export async function sendWeeklyDigest(opts: { force?: boolean } = {}): Promise<{ sent: number; skipped: string }> {
  const { sections } = await buildDigest();
  if (sections.length === 0 && !opts.force) return { sent: 0, skipped: "nothing new this week" };

  const subs = await db.newsletterSubscriber.findMany({ where: { status: "SUBSCRIBED" } });
  if (subs.length === 0) return { sent: 0, skipped: "no subscribers" };

  const subject = `Career Forge weekly — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
  let sent = 0;

  for (const sub of subs) {
    try {
      await sendEmail({
        to: sub.email,
        template: "newsletter-digest",
        subject,
        data: {
          title: "This week on Career Forge",
          intro: "Here's what's new — jobs, guides and courses for the week.",
          sections,
          unsubscribeUrl: appUrl(`/api/newsletter/unsubscribe?token=${sub.token}`),
        },
      });
      sent += 1;
    } catch (err) {
      console.error("digest send failed for", sub.email, err);
    }
  }

  await db.newsletterSubscriber.updateMany({
    where: { id: { in: subs.map((s) => s.id) } },
    data: { lastSentAt: new Date() },
  });

  return { sent, skipped: "" };
}
