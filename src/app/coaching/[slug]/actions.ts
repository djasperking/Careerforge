"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { createCheckout } from "@/lib/billing/service";
import { linesToList } from "@/lib/course/schema";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const schema = z.object({
  preferredTimes: z.string().max(1000),
  note: z.string().max(1000).optional().or(z.literal("")),
});

/**
 * Create a pending booking and start checkout for it. On successful payment the
 * booking moves to REQUESTED and the coach is notified to confirm a time.
 */
export async function requestCoachingBooking(offerId: string, raw: unknown): Promise<Result<{ authorizationUrl: string }>> {
  try {
    const user = await requireUserApi();
    rateLimit(`coaching-book:${user.id}`, { windowSeconds: 60, max: 5 });
    const input = schema.parse(raw);

    const offer = await db.coachingOffer.findFirst({
      where: { id: offerId, status: "PUBLISHED", reviewStatus: "APPROVED" },
    });
    if (!offer) throw new ApiError(404, "NOT_FOUND", "This coaching offer is not available.");
    if (offer.coachId === user.id) throw new ApiError(422, "OWN_OFFER", "You can't book your own offer.");
    if (offer.priceCents <= 0) throw new ApiError(422, "FREE", "This offer is free — contact the coach directly.");

    const times = linesToList(input.preferredTimes);
    if (times.length === 0) throw new ApiError(422, "NO_TIMES", "Suggest at least one time that works for you.");

    // Reuse an unpaid booking for this offer if the buyer abandoned checkout.
    const existing = await db.coachingBooking.findFirst({
      where: { offerId, userId: user.id, status: "PENDING_PAYMENT" },
    });
    const booking = existing
      ? await db.coachingBooking.update({
          where: { id: existing.id },
          data: { preferredTimes: times, note: input.note || null },
        })
      : await db.coachingBooking.create({
          data: { offerId, userId: user.id, preferredTimes: times, note: input.note || null, status: "PENDING_PAYMENT" },
        });

    const { authorizationUrl, reference } = await createCheckout({
      userId: user.id,
      email: user.email,
      productType: "COACHING",
      productId: booking.id,
    });
    await audit({ actorId: user.id, action: "CHECKOUT_STARTED", entity: "CoachingBooking", entityId: booking.id, metadata: { reference } });
    return { ok: true, data: { authorizationUrl: authorizationUrl ?? `/dashboard/payments/callback?reference=${reference}` } };
  } catch (err) {
    return fail(err);
  }
}
