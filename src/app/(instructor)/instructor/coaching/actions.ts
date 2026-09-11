"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireApprovedInstructor } from "@/lib/instructor/service";
import { uniqueCoachingSlug, requireOwnedCoachingOffer } from "@/lib/marketplace/coaching";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

const offerSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(20).max(4000),
  coverImageUrl: z.string().max(400).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(15).max(240),
  priceCents: z.coerce.number().int().min(0).max(100_000_000),
  currency: z.string().min(3).max(3).default("NGN"),
});

export async function createMyOffer(raw: unknown): Promise<Result<{ id: string }>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const input = offerSchema.parse(raw);
    const slug = await uniqueCoachingSlug(input.title);
    const offer = await db.coachingOffer.create({
      data: {
        slug,
        coachId: user.id,
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl || null,
        durationMinutes: input.durationMinutes,
        priceCents: input.priceCents,
        currency: input.currency,
        status: "DRAFT",
        reviewStatus: "DRAFT",
      },
    });
    await audit({ actorId: user.id, action: "COACHING_OFFER_CREATED", entity: "CoachingOffer", entityId: offer.id });
    revalidatePath("/instructor/coaching");
    return { ok: true, data: { id: offer.id } };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMyOffer(id: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const offer = await requireOwnedCoachingOffer(user.id, id);
    if (offer.reviewStatus === "SUBMITTED") throw new ApiError(409, "LOCKED", "This offer is awaiting review.");
    const input = offerSchema.parse(raw);
    const slug = offer.title === input.title ? offer.slug : await uniqueCoachingSlug(input.title, id);
    await db.coachingOffer.update({
      where: { id },
      data: {
        slug,
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl || null,
        durationMinutes: input.durationMinutes,
        priceCents: input.priceCents,
        currency: input.currency,
        reviewStatus: offer.reviewStatus === "APPROVED" ? "DRAFT" : offer.reviewStatus,
        status: offer.reviewStatus === "APPROVED" ? "DRAFT" : offer.status,
      },
    });
    await audit({ actorId: user.id, action: "COACHING_OFFER_UPDATED", entity: "CoachingOffer", entityId: id });
    revalidatePath(`/instructor/coaching/${id}`);
    revalidatePath("/instructor/coaching");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function submitOfferForReview(id: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const offer = await requireOwnedCoachingOffer(user.id, id);
    if (offer.reviewStatus === "SUBMITTED") throw new ApiError(409, "ALREADY_SUBMITTED", "Already submitted.");
    if (offer.reviewStatus === "APPROVED") throw new ApiError(409, "ALREADY_APPROVED", "Already approved.");
    if (offer.description.trim().length < 20) throw new ApiError(422, "THIN_DESCRIPTION", "Write a fuller description first.");
    await db.coachingOffer.update({ where: { id }, data: { reviewStatus: "SUBMITTED", submittedAt: new Date(), reviewNote: null } });
    await audit({ actorId: user.id, action: "COACHING_OFFER_SUBMITTED", entity: "CoachingOffer", entityId: id });
    const reviewers = await db.user.findMany({
      where: { roles: { some: { role: { permissions: { some: { permission: { key: "submissions:review" } } } } } } },
      select: { id: true },
      take: 25,
    });
    await db.notification.createMany({
      data: reviewers.map((r) => ({
        userId: r.id,
        type: "ANNOUNCEMENT",
        title: "Coaching offer awaiting review",
        body: `"${offer.title}" was submitted for review.`,
        linkUrl: "/admin/review",
      })),
    });
    revalidatePath(`/instructor/coaching/${id}`);
    revalidatePath("/instructor/coaching");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setMyOfferPublished(id: string, publish: boolean): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const offer = await requireOwnedCoachingOffer(user.id, id);
    if (publish && offer.reviewStatus !== "APPROVED") throw new ApiError(409, "NOT_APPROVED", "Only an approved offer can be published.");
    await db.coachingOffer.update({
      where: { id },
      data: { status: publish ? "PUBLISHED" : "UNPUBLISHED", publishedAt: publish && !offer.publishedAt ? new Date() : offer.publishedAt },
    });
    await audit({ actorId: user.id, action: publish ? "COACHING_OFFER_PUBLISHED" : "COACHING_OFFER_UNPUBLISHED", entity: "CoachingOffer", entityId: id });
    revalidatePath(`/instructor/coaching/${id}`);
    revalidatePath("/instructor/coaching");
    revalidatePath("/coaching");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function reopenMyOffer(id: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    await requireApprovedInstructor(user.id);
    const offer = await requireOwnedCoachingOffer(user.id, id);
    if (offer.reviewStatus === "SUBMITTED") throw new ApiError(409, "LOCKED", "Wait for the current review to finish.");
    await db.coachingOffer.update({
      where: { id },
      data: { reviewStatus: "DRAFT", status: offer.status === "PUBLISHED" ? "DRAFT" : offer.status },
    });
    revalidatePath(`/instructor/coaching/${id}`);
    revalidatePath("/coaching");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

// ---- Coach handling a booking -------------------------------------------

const confirmSchema = z.object({
  scheduledAt: z.string().min(1, "Pick a date and time."),
  meetingUrl: z.string().url("Enter a valid meeting link.").max(500),
  coachNote: z.string().max(1000).optional().or(z.literal("")),
});

export async function confirmBooking(bookingId: string, raw: unknown): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const input = confirmSchema.parse(raw);
    const booking = await db.coachingBooking.findFirst({
      where: { id: bookingId, offer: { coachId: user.id } },
      include: { offer: true },
    });
    if (!booking) throw new ApiError(404, "NOT_FOUND", "Booking not found.");
    if (booking.status !== "REQUESTED") throw new ApiError(409, "NOT_PENDING", "This booking can't be confirmed.");

    await db.coachingBooking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        scheduledAt: new Date(input.scheduledAt),
        meetingUrl: input.meetingUrl,
        coachNote: input.coachNote || null,
      },
    });
    await db.notification.create({
      data: {
        userId: booking.userId,
        type: "ANNOUNCEMENT",
        title: `Your coaching session is confirmed`,
        body: `"${booking.offer.title}" — check My Purchases for the time and join link.`,
        linkUrl: "/dashboard/purchases",
      },
    });
    await audit({ actorId: user.id, action: "COACHING_BOOKING_CONFIRMED", entity: "CoachingBooking", entityId: bookingId });
    revalidatePath("/instructor/coaching");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}

export async function markBookingComplete(bookingId: string): Promise<Result<null>> {
  try {
    const user = await requireUserApi();
    const booking = await db.coachingBooking.findFirst({ where: { id: bookingId, offer: { coachId: user.id } } });
    if (!booking) throw new ApiError(404, "NOT_FOUND", "Booking not found.");
    if (booking.status !== "CONFIRMED") throw new ApiError(409, "NOT_CONFIRMED", "Only a confirmed session can be completed.");
    await db.coachingBooking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
    revalidatePath("/instructor/coaching");
    return { ok: true, data: null };
  } catch (err) {
    return fail(err);
  }
}
