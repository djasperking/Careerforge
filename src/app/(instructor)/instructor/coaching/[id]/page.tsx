import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getInstructorProfile } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OfferForm } from "../offer-form";
import { OfferReviewPanel } from "./review-panel";

export default async function InstructorOfferEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!profile || profile.status !== "APPROVED") redirect("/instructor");

  const { id } = await params;
  const offer = await db.coachingOffer.findFirst({
    where: { id, coachId: user.id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!offer) notFound();

  const locked = offer.reviewStatus === "SUBMITTED";

  return (
    <div>
      <PageHeader
        title={offer.title}
        description={`${offer._count.bookings} bookings · ${offer.status === "PUBLISHED" ? "Live" : "Not live"}`}
      />

      <OfferReviewPanel
        offerId={offer.id}
        reviewStatus={offer.reviewStatus}
        publishStatus={offer.status}
        reviewNote={offer.reviewNote}
        revenueSharePercent={offer.revenueSharePercent}
      />

      {locked ? (
        <Alert variant="warning" className="mb-6">
          <AlertTitle>This offer is awaiting review</AlertTitle>
          <AlertDescription>You can&apos;t edit it until a decision is made.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Offer details</CardTitle></CardHeader>
        <CardContent>
          <OfferForm
            offerId={offer.id}
            locked={locked}
            initial={{
              title: offer.title,
              description: offer.description,
              coverImageUrl: offer.coverImageUrl ?? "",
              durationMinutes: offer.durationMinutes,
              priceCents: offer.priceCents,
              currency: offer.currency,
            }}
          />
        </CardContent>
      </Card>

      <p className="mt-6 text-sm">
        <Link href="/instructor/coaching" className="text-primary hover:underline">← Back to coaching</Link>
      </p>
    </div>
  );
}
