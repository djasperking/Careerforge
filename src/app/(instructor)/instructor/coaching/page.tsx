import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getInstructorProfile } from "@/lib/instructor/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BookingRow } from "./booking-row";

export const metadata = { title: "Coaching" };

const BADGE: Record<string, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "In review", variant: "warning" },
  CHANGES_REQUESTED: { label: "Changes requested", variant: "destructive" },
  APPROVED: { label: "Approved", variant: "success" },
};

export default async function InstructorCoachingPage() {
  const user = await requireUser();
  const profile = await getInstructorProfile(user.id);
  if (!profile || profile.status !== "APPROVED") {
    return (
      <div>
        <PageHeader title="Coaching" description="Offer paid one-on-one sessions." />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You need an approved instructor account first.{" "}
            <Link href="/instructor" className="text-primary hover:underline">Apply to teach</Link>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [offers, bookings] = await Promise.all([
    db.coachingOffer.findMany({
      where: { coachId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { bookings: true } } },
    }),
    db.coachingBooking.findMany({
      where: { offer: { coachId: user.id }, status: { in: ["REQUESTED", "CONFIRMED"] } },
      include: { offer: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Coaching"
        description="Offer paid one-on-one sessions. Every offer is reviewed before it goes live."
        action={<Button asChild><Link href="/instructor/coaching/new">New offer</Link></Button>}
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>Booking requests ({bookings.length})</CardTitle></CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No pending bookings.</p>
          ) : (
            <ul className="space-y-4">
              {bookings.map((b) => (
                <li key={b.id}>
                  <BookingRow
                    bookingId={b.id}
                    offerTitle={b.offer.title}
                    buyerName={b.user.name || b.user.email}
                    status={b.status}
                    preferredTimes={b.preferredTimes}
                    note={b.note}
                    scheduledAt={b.scheduledAt ? formatDate(b.scheduledAt, { hour: "2-digit", minute: "2-digit" }) : null}
                    meetingUrl={b.meetingUrl}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My offers</CardTitle></CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing yet. <Link href="/instructor/coaching/new" className="text-primary hover:underline">Create your first offer.</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {offers.map((o) => {
                const badge = BADGE[o.reviewStatus];
                return (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <Link href={`/instructor/coaching/${o.id}`} className="font-medium hover:underline">{o.title}</Link>
                        <p className="text-xs text-muted-foreground">
                          {o.durationMinutes} min · {formatCurrency(o.priceCents, o.currency)} · {o._count.bookings} bookings · {o.status === "PUBLISHED" ? "Live" : "Not live"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
