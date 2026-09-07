import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";

export const metadata = {
  title: "Newsletter",
  description: "A weekly email of new jobs, guides and courses from Career Forge.",
};

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />
      <main className="container max-w-lg py-16">
        {sp.u === "1" ? (
          <Alert className="mb-6"><AlertDescription>You&apos;ve been unsubscribed. Sorry to see you go.</AlertDescription></Alert>
        ) : null}
        {sp.u === "0" ? (
          <Alert variant="destructive" className="mb-6"><AlertDescription>That unsubscribe link is invalid or expired.</AlertDescription></Alert>
        ) : null}

        <h1 className="font-display text-3xl font-semibold">The Career Forge weekly</h1>
        <p className="mt-2 text-muted-foreground">
          One email every Monday: the newest remote jobs, fresh career guides, and any new courses.
          No spam, unsubscribe in one click.
        </p>
        <div className="mt-6">
          <SubscribeForm source="newsletter-page" />
        </div>
      </main>
    </div>
  );
}
