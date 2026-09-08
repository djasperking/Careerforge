import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { BookForm } from "./book-form";
import { checkMaintenance } from "@/components/maintenance/section-notice";

export default async function CoachingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { notice } = await checkMaintenance("coaching");
  if (notice) return notice;
  const [offer, user] = await Promise.all([
    db.coachingOffer.findFirst({
      where: { slug, status: "PUBLISHED", reviewStatus: "APPROVED" },
      include: { coach: true },
    }),
    getCurrentUser(),
  ]);
  if (!offer) notFound();

  const priceLabel = formatCurrency(offer.priceCents, offer.currency);

  return (
    <div className="min-h-screen">
      <MarketingHeader loggedIn={Boolean(user)} />

      <main className="container grid gap-10 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {offer.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offer.coverImageUrl} alt="" className="mb-6 w-full rounded-lg border object-cover" />
          ) : null}
          <h1 className="font-display text-3xl font-semibold">{offer.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {offer.durationMinutes} min · with {offer.coach?.name ?? "Career Forge"}
          </p>
          <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-foreground">{offer.description}</div>
        </div>

        <aside className="lg:col-span-1">
          <div className="rounded-lg border bg-card p-5">
            <p className="font-display text-2xl font-semibold">{priceLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{offer.durationMinutes}-minute session</p>
            <div className="mt-4">
              <BookForm offerId={offer.id} slug={offer.slug} isLoggedIn={Boolean(user)} priceLabel={priceLabel} />
            </div>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
