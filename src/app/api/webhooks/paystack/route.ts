import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { getPaymentProvider } from "@/lib/payments";
import { finalizeTransaction } from "@/lib/billing/service";

const SUCCESS_EVENTS = new Set(["charge.success", "checkout.success"]);

/**
 * Webhook backstop: fires even if the customer closes the tab before the
 * browser callback runs. Idempotent on (provider, eventId) — Paystack retries
 * webhooks, and this must be a safe no-op on a repeat delivery.
 */
export const POST = handler(async (req: NextRequest) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const provider = getPaymentProvider();

  let event;
  try {
    event = provider.parseWebhook(rawBody, signature);
  } catch (err) {
    throw new ApiError(401, "BAD_SIGNATURE", (err as Error).message);
  }

  const existing = await db.paymentWebhookEvent.findUnique({
    where: { provider_eventId: { provider: provider.name, eventId: event.eventId } },
  });
  if (existing) return ok({ received: true, duplicate: true });

  const stored = await db.paymentWebhookEvent.create({
    data: { provider: provider.name, eventId: event.eventId, eventType: event.eventType, payload: event.raw as never },
  });

  if (SUCCESS_EVENTS.has(event.eventType) && event.reference) {
    try {
      const transaction = await finalizeTransaction(event.reference);
      await db.paymentWebhookEvent.update({
        where: { id: stored.id },
        data: { transactionId: transaction.id, processedAt: new Date() },
      });
    } catch (err) {
      console.error("webhook finalize failed", err);
    }
  } else {
    await db.paymentWebhookEvent.update({ where: { id: stored.id }, data: { processedAt: new Date() } });
  }

  return ok({ received: true });
});
