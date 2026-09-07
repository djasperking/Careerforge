import { requirePermissionPage } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { renderEmail } from "@/lib/email/templates";
import { subscriberCounts, buildDigest } from "@/lib/newsletter/service";
import { formatDate } from "@/lib/utils";
import { SendDigestButton } from "./send-button";

export const metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage() {
  await requirePermissionPage("content:write");

  const [counts, digest, recent] = await Promise.all([
    subscriberCounts(),
    buildDigest(),
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const preview = renderEmail("newsletter-digest", {
    title: "This week on Career Forge",
    intro: "Here's what's new — jobs, guides and courses for the week.",
    sections: digest.sections,
    unsubscribeUrl: "#",
  }).html;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly digest"
        description="Auto-built from the week's new jobs, blog posts and courses. Sent every Monday 09:00 UTC by Vercel Cron; you can also send manually."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Subscribers</p>
          <p className="mt-1 font-display text-2xl font-semibold">{counts.subscribed}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">This week&apos;s digest</p>
          <p className="mt-1 text-sm">{digest.counts.jobs} jobs · {digest.counts.posts} posts · {digest.counts.courses} courses</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">All-time signups</p>
          <p className="mt-1 font-display text-2xl font-semibold">{counts.total}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Send</CardTitle></CardHeader>
        <CardContent>
          {digest.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing new this week &mdash; the scheduled send will skip. You can still force a send below.</p>
          ) : null}
          <div className="mt-2"><SendDigestButton subscribers={counts.subscribed} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
        <CardContent>
          <iframe title="Digest preview" srcDoc={preview} className="h-[520px] w-full rounded-md border bg-white" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent subscribers</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No subscribers yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span>{s.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.status === "SUBSCRIBED" ? formatDate(s.createdAt) : "unsubscribed"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
