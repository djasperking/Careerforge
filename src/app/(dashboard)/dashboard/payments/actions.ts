"use server";

import { requireUserApi } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { createCheckout } from "@/lib/billing/service";
import { audit } from "@/lib/audit";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
function fail(err: unknown): Result<never> {
  if (err instanceof ApiError) return { ok: false, error: err.message };
  console.error(err);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function startCourseCheckout(courseId: string): Promise<Result<{ authorizationUrl: string }>> {
  try {
    const user = await requireUserApi();
    rateLimit(`checkout:${user.id}`, { windowSeconds: 60, max: 10 });
    const { authorizationUrl, reference } = await createCheckout({
      userId: user.id,
      email: user.email,
      productType: "COURSE",
      productId: courseId,
    });
    await audit({ actorId: user.id, action: "CHECKOUT_STARTED", entity: "Course", entityId: courseId, metadata: { reference } });
    return { ok: true, data: { authorizationUrl } };
  } catch (err) {
    return fail(err);
  }
}

export async function startSubscriptionCheckout(planId: string): Promise<Result<{ authorizationUrl: string }>> {
  try {
    const user = await requireUserApi();
    rateLimit(`checkout:${user.id}`, { windowSeconds: 60, max: 10 });
    const { authorizationUrl, reference } = await createCheckout({
      userId: user.id,
      email: user.email,
      productType: "SUBSCRIPTION",
      productId: planId,
    });
    await audit({ actorId: user.id, action: "CHECKOUT_STARTED", entity: "SubscriptionPlan", entityId: planId, metadata: { reference } });
    return { ok: true, data: { authorizationUrl } };
  } catch (err) {
    return fail(err);
  }
}

export async function startCvUnlockCheckout(cvId: string): Promise<Result<{ authorizationUrl: string }>> {
  try {
    const user = await requireUserApi();
    rateLimit(`checkout:${user.id}`, { windowSeconds: 60, max: 10 });
    const { authorizationUrl, reference } = await createCheckout({
      userId: user.id,
      email: user.email,
      productType: "CV_PREMIUM",
      productId: cvId,
    });
    await audit({ actorId: user.id, action: "CHECKOUT_STARTED", entity: "CV", entityId: cvId, metadata: { reference } });
    return { ok: true, data: { authorizationUrl } };
  } catch (err) {
    return fail(err);
  }
}

export async function startDigitalProductCheckout(productId: string): Promise<Result<{ authorizationUrl: string }>> {
  try {
    const user = await requireUserApi();
    rateLimit(`checkout:${user.id}`, { windowSeconds: 60, max: 10 });
    const { authorizationUrl, reference } = await createCheckout({
      userId: user.id,
      email: user.email,
      productType: "DIGITAL_PRODUCT",
      productId,
    });
    await audit({ actorId: user.id, action: "CHECKOUT_STARTED", entity: "DigitalProduct", entityId: productId, metadata: { reference } });
    return { ok: true, data: { authorizationUrl } };
  } catch (err) {
    return fail(err);
  }
}

export async function startCoachingCheckout(bookingId: string): Promise<Result<{ authorizationUrl: string }>> {
  try {
    const user = await requireUserApi();
    rateLimit(`checkout:${user.id}`, { windowSeconds: 60, max: 10 });
    const { authorizationUrl, reference } = await createCheckout({
      userId: user.id,
      email: user.email,
      productType: "COACHING",
      productId: bookingId,
    });
    await audit({ actorId: user.id, action: "CHECKOUT_STARTED", entity: "CoachingBooking", entityId: bookingId, metadata: { reference } });
    return { ok: true, data: { authorizationUrl } };
  } catch (err) {
    return fail(err);
  }
}
