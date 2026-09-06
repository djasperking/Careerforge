import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { getPaymentProvider, newPaymentReference } from "@/lib/payments";
import { sendEmail, appUrl } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";
import { cvUnlockPrice } from "@/lib/cv/service";
import { effectivePriceCents, discountIsActive } from "@/lib/instructor/service";
import type { ProductType } from "@prisma/client";

export const CALLBACK_PATH = "/dashboard/payments/callback";

/** Pure — how long a paid subscription period lasts, in days. */
export function subscriptionPeriodDays(billingPeriod: string): number {
  if (billingPeriod === "yearly") return 365;
  if (billingPeriod === "monthly") return 30;
  return 36_500; // "none" / lifetime-style plans
}

interface CheckoutProduct {
  amountCents: number;
  currency: string;
  description: string;
}

async function resolveProduct(productType: ProductType, productId: string, userId: string): Promise<CheckoutProduct> {
  if (productType === "COURSE") {
    const course = await db.course.findUnique({ where: { id: productId } });
    if (!course || course.status !== "PUBLISHED" || course.reviewStatus !== "APPROVED") {
      throw new ApiError(404, "NOT_FOUND", "Course not available.");
    }
    if (course.priceCents <= 0) throw new ApiError(422, "FREE_PRODUCT", "This course is free — enrol directly.");
    const existing = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: productId } } });
    if (existing) throw new ApiError(409, "ALREADY_OWNED", "You're already enrolled in this course.");
    // Price is always resolved server-side, including any active discount.
    const amountCents = effectivePriceCents(course);
    const label = discountIsActive(course) ? `Course: ${course.title} (${course.discountPercent}% off)` : `Course: ${course.title}`;
    return { amountCents, currency: course.currency, description: label };
  }

  if (productType === "SUBSCRIPTION") {
    const plan = await db.subscriptionPlan.findUnique({ where: { id: productId } });
    if (!plan || !plan.isActive) throw new ApiError(404, "NOT_FOUND", "Plan not available.");
    if (plan.priceCents <= 0) throw new ApiError(422, "FREE_PRODUCT", "This plan is free — no checkout needed.");
    return { amountCents: plan.priceCents, currency: plan.currency, description: `Subscription: ${plan.name}` };
  }

  if (productType === "CV_PREMIUM") {
    const cv = await db.cV.findFirst({ where: { id: productId, userId, deletedAt: null } });
    if (!cv) throw new ApiError(404, "NOT_FOUND", "CV not found.");
    if (cv.isPremium) throw new ApiError(409, "ALREADY_OWNED", "This CV is already unlocked.");
    const { amountCents, currency } = await cvUnlockPrice();
    return { amountCents, currency, description: `CV unlock: ${cv.title}` };
  }

  if (productType === "DIGITAL_PRODUCT") {
    const product = await db.digitalProduct.findUnique({ where: { id: productId } });
    if (!product || product.status !== "PUBLISHED" || product.reviewStatus !== "APPROVED") {
      throw new ApiError(404, "NOT_FOUND", "Product not available.");
    }
    if (product.priceCents <= 0) throw new ApiError(422, "FREE_PRODUCT", "This product is free — download it directly.");
    const owned = await db.digitalProductPurchase.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (owned) throw new ApiError(409, "ALREADY_OWNED", "You already own this product.");
    const amountCents = effectivePriceCents(product);
    const label = discountIsActive(product) ? `${product.title} (${product.discountPercent}% off)` : product.title;
    return { amountCents, currency: product.currency, description: label };
  }

  if (productType === "COACHING") {
    // productId is a CoachingBooking already created in PENDING_PAYMENT state.
    const booking = await db.coachingBooking.findFirst({
      where: { id: productId, userId },
      include: { offer: true },
    });
    if (!booking) throw new ApiError(404, "NOT_FOUND", "Booking not found.");
    if (booking.status !== "PENDING_PAYMENT") throw new ApiError(409, "ALREADY_PAID", "This booking has already been paid for.");
    const offer = booking.offer;
    if (offer.status !== "PUBLISHED" || offer.reviewStatus !== "APPROVED") {
      throw new ApiError(404, "NOT_FOUND", "This coaching offer is no longer available.");
    }
    if (offer.priceCents <= 0) throw new ApiError(422, "FREE_PRODUCT", "This session is free.");
    return { amountCents: offer.priceCents, currency: offer.currency, description: `Coaching: ${offer.title}` };
  }

  throw new ApiError(422, "UNSUPPORTED_PRODUCT", `Checkout for ${productType} is not implemented yet.`);
}

export async function createCheckout(input: {
  userId: string;
  email: string;
  productType: ProductType;
  productId: string;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const product = await resolveProduct(input.productType, input.productId, input.userId);
  const reference = newPaymentReference(input.productType, input.userId);

  await db.transaction.create({
    data: {
      reference,
      userId: input.userId,
      productType: input.productType,
      productId: input.productId,
      description: product.description,
      amountCents: product.amountCents,
      currency: product.currency,
      provider: getPaymentProvider().name,
    },
  });

  const checkout = await getPaymentProvider().initCheckout({
    reference,
    email: input.email,
    amountCents: product.amountCents,
    currency: product.currency,
    metadata: { productType: input.productType, productId: input.productId, userId: input.userId },
    callbackUrl: appUrl(CALLBACK_PATH),
  });

  await db.transaction.update({ where: { reference }, data: { providerRef: checkout.providerRef } });
  return { authorizationUrl: checkout.authorizationUrl, reference };
}

/**
 * Activate the product a transaction paid for. Called from both the browser
 * callback and the webhook — whichever arrives first wins; the other is a
 * safe no-op because we only ever activate a transaction still PENDING.
 */
async function activateProduct(transaction: { id: string; userId: string; productType: ProductType; productId: string | null }) {
  if (transaction.productType === "COURSE" && transaction.productId) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: transaction.userId, courseId: transaction.productId } },
      create: { userId: transaction.userId, courseId: transaction.productId, transactionId: transaction.id },
      update: { transactionId: transaction.id },
    });
  } else if (transaction.productType === "SUBSCRIPTION" && transaction.productId) {
    const plan = await db.subscriptionPlan.findUniqueOrThrow({ where: { id: transaction.productId } });
    const days = subscriptionPeriodDays(plan.billingPeriod);
    await db.subscription.updateMany({
      where: { userId: transaction.userId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });
    await db.subscription.create({
      data: {
        userId: transaction.userId,
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + days * 86_400_000),
        transactionId: transaction.id,
      },
    });
  } else if (transaction.productType === "CV_PREMIUM" && transaction.productId) {
    await db.cV.updateMany({
      where: { id: transaction.productId, userId: transaction.userId },
      data: { isPremium: true },
    });
  } else if (transaction.productType === "DIGITAL_PRODUCT" && transaction.productId) {
    await db.digitalProductPurchase.upsert({
      where: { productId_userId: { productId: transaction.productId, userId: transaction.userId } },
      create: { productId: transaction.productId, userId: transaction.userId, transactionId: transaction.id },
      update: { transactionId: transaction.id },
    });
    await db.notification.create({
      data: {
        userId: transaction.userId,
        type: "PAYMENT",
        title: "Your download is ready",
        body: "Open My Purchases to download your product.",
        linkUrl: "/dashboard/purchases",
      },
    }).catch(() => {});
  } else if (transaction.productType === "COACHING" && transaction.productId) {
    const updated = await db.coachingBooking.updateMany({
      where: { id: transaction.productId, userId: transaction.userId, status: "PENDING_PAYMENT" },
      data: { status: "REQUESTED", transactionId: transaction.id },
    });
    if (updated.count > 0) {
      const booking = await db.coachingBooking.findUnique({
        where: { id: transaction.productId },
        include: { offer: true },
      });
      if (booking) {
        await db.notification.create({
          data: {
            userId: booking.offer.coachId,
            type: "ANNOUNCEMENT",
            title: "New coaching booking",
            body: `Someone booked "${booking.offer.title}". Confirm a time from your coaching dashboard.`,
            linkUrl: "/instructor/coaching",
          },
        }).catch(() => {});
      }
    }
  }
}

/**
 * The single, idempotent finish line for a payment. Verifies with the
 * provider — never trusts a client-reported outcome — and only activates the
 * product the first time a transaction turns SUCCESS.
 */
export async function finalizeTransaction(reference: string) {
  const transaction = await db.transaction.findUnique({ where: { reference }, include: { user: true } });
  if (!transaction) throw new ApiError(404, "NOT_FOUND", "Transaction not found.");
  if (transaction.status === "SUCCESS") return transaction; // already activated — idempotent

  let result;
  try {
    result = await getPaymentProvider().verify(reference);
  } catch (err) {
    await db.transaction.update({
      where: { reference },
      data: { status: "VERIFICATION_FAILED", metadata: { error: (err as Error).message } as never },
    });
    throw new ApiError(502, "VERIFICATION_FAILED", "Could not verify this payment with the provider. Please try again shortly.");
  }

  const statusMap = {
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    ABANDONED: "ABANDONED",
    PENDING: "PENDING",
  } as const;
  const nextStatus = statusMap[result.status];

  if (nextStatus !== "SUCCESS") {
    const updated = await db.transaction.update({
      where: { reference },
      data: { status: nextStatus === "PENDING" ? "PENDING" : nextStatus, metadata: result.raw as never },
    });
    return updated;
  }

  const updated = await db.$transaction(async (tx) => {
    const fresh = await tx.transaction.findUniqueOrThrow({ where: { reference } });
    if (fresh.status === "SUCCESS") return fresh; // race guard
    const t = await tx.transaction.update({
      where: { reference },
      data: { status: "SUCCESS", paidAt: result.paidAt ?? new Date(), metadata: result.raw as never },
    });
    return t;
  });

  await activateProduct(updated);

  await db.notification.create({
    data: {
      userId: transaction.userId,
      type: "PAYMENT",
      title: "Payment successful",
      body: `${transaction.description ?? transaction.productType} — ${formatCurrency(transaction.amountCents, transaction.currency)}`,
      linkUrl: "/dashboard/payments",
    },
  });
  await sendEmail({
    to: transaction.user.email,
    template: "payment-confirmation",
    subject: "Your Career Forge receipt",
    data: {
      reference,
      description: transaction.description,
      amount: formatCurrency(transaction.amountCents, transaction.currency),
    },
  }).catch(() => {});

  return updated;
}

export async function refundTransaction(transactionId: string) {
  const transaction = await db.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  if (transaction.status !== "SUCCESS") {
    throw new ApiError(409, "NOT_REFUNDABLE", "Only successful transactions can be refunded.");
  }

  await db.transaction.update({ where: { id: transactionId }, data: { status: "REFUNDED" } });

  if (transaction.productType === "COURSE" && transaction.productId) {
    await db.enrollment.updateMany({
      where: { userId: transaction.userId, courseId: transaction.productId },
      data: { status: "REFUNDED" },
    });
  } else if (transaction.productType === "SUBSCRIPTION") {
    await db.subscription.updateMany({
      where: { transactionId },
      data: { status: "CANCELLED", cancelAtPeriodEnd: true },
    });
  } else if (transaction.productType === "CV_PREMIUM" && transaction.productId) {
    await db.cV.updateMany({
      where: { id: transaction.productId, userId: transaction.userId },
      data: { isPremium: false },
    });
  }

  await db.notification.create({
    data: {
      userId: transaction.userId,
      type: "PAYMENT",
      title: "Payment refunded",
      body: `${transaction.description ?? transaction.productType} has been refunded.`,
      linkUrl: "/dashboard/payments",
    },
  });

  return transaction;
}
