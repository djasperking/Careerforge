"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { joinCohortFree, joinCohortWaitlist } from "./actions";
import { startCourseCheckout } from "@/app/(dashboard)/dashboard/payments/actions";

export type PublicCohort = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  enrollByDate: string | null;
  priceCents: number;
  currency: string;
  seatsLeft: number | null;
  scheduleNote: string | null;
  joined: boolean;
  waitlisted: boolean;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function money(c: number, cur: string) {
  return c === 0 ? "Free" : new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(c / 100);
}

export function CohortList({
  courseId,
  slug,
  cohorts,
  isLoggedIn,
  ownsCourse,
}: {
  courseId: string;
  slug: string;
  cohorts: PublicCohort[];
  isLoggedIn: boolean;
  ownsCourse: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (cohorts.length === 0) return null;

  async function join(c: PublicCohort) {
    setBusyId(c.id);
    setError(null);
    // Free to join when the course is already owned, or the class itself is free.
    if (ownsCourse || c.priceCents === 0) {
      const res = await joinCohortFree(c.id, slug);
      setBusyId(null);
      if (res.ok) router.refresh();
      else setError(res.error);
    } else {
      const res = await startCourseCheckout(courseId, c.id);
      setBusyId(null);
      if (res.ok) window.location.href = res.data.authorizationUrl;
      else setError(res.error);
    }
  }

  async function waitlist(c: PublicCohort) {
    setBusyId(c.id);
    setError(null);
    const res = await joinCohortWaitlist(c.id, slug);
    setBusyId(null);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  return (
    <div className="mt-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <CalendarDays className="size-5" /> Upcoming classes
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Prefer a guided cohort? Join a scheduled class with a set start date and live sessions.
      </p>
      {error ? <Alert variant="destructive" className="mt-3"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <div className="mt-4 space-y-3">
        {cohorts.map((c) => (
          <div key={c.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">
                  {fmt(c.startDate)} – {fmt(c.endDate)}
                  {c.enrollByDate ? ` · enrol by ${fmt(c.enrollByDate)}` : ""}
                  {c.seatsLeft != null ? ` · ${c.seatsLeft} seat${c.seatsLeft === 1 ? "" : "s"} left` : ""}
                </p>
                {c.scheduleNote ? <p className="mt-1 text-sm text-muted-foreground">{c.scheduleNote}</p> : null}
              </div>
              <div className="text-right">
                <p className="font-display font-semibold">{ownsCourse ? "Included" : money(c.priceCents, c.currency)}</p>
              </div>
            </div>
            <div className="mt-3">
              {c.joined ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/courses/${courseId}`}>You&apos;re in — open</Link>
                </Button>
              ) : !isLoggedIn ? (
                <Button asChild size="sm">
                  <Link href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`}>Log in to join</Link>
                </Button>
              ) : c.waitlisted ? (
                <Button size="sm" variant="outline" disabled>On the waitlist</Button>
              ) : c.seatsLeft === 0 ? (
                <Button size="sm" variant="outline" onClick={() => waitlist(c)} disabled={busyId === c.id}>
                  {busyId === c.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  Join the waitlist
                </Button>
              ) : (
                <Button size="sm" onClick={() => join(c)} disabled={busyId === c.id}>
                  {busyId === c.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  {ownsCourse || c.priceCents === 0 ? "Join this class" : "Join — pay now"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
