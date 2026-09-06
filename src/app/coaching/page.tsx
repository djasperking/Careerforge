import Link from "next/link";
import { db } from "@/lib/db";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Coaching" };

export default async function PublicCoachingPage() {
  const [offers, user] = await Promise.all([
    db.coachingOffer.findMany({
      where: { status: "PUBLISHED", reviewStatus: "APPROVED" },
      include: { coach: true },
      orderBy: { publishedAt: "desc" },
      take: 60,
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="container py-10">
        <h1 className="font-display text-3xl font-semibold">1-on-1 coaching</h1>
        <p className="mt-1 text-muted-foreground">Book a paid session with a Career Forge instructor.</p>

        {offers.length === 0 ? (
          <EmptyState title="No coaching offers yet" description="Check back soon." />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((o) => (
              <Link key={o.id} href={`/coaching/${o.slug}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="p-5">
                    {o.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.coverImageUrl} alt="" className="mb-3 h-32 w-full rounded-md border object-cover" />
                    ) : null}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{formatCurrency(o.priceCents, o.currency)}</span>
                      <span className="text-muted-foreground">{o.durationMinutes} min</span>
                    </div>
                    <h2 className="mt-2 font-display text-lg font-semibold">{o.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">With {o.coach?.name ?? "Career Forge"}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
