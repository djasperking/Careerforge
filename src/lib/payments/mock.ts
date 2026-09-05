import { randomUUID } from "crypto";
import type { PaymentProvider } from "./types";

/**
 * Mock payment provider for local development without Paystack keys.
 * initCheckout returns a local page that simulates a successful redirect;
 * verify always reports SUCCESS for a known reference.
 */
export const mockPaymentProvider: PaymentProvider = {
  name: "mock",

  async initCheckout(input) {
    const params = new URLSearchParams({ reference: input.reference, redirect: input.callbackUrl });
    return {
      provider: "mock",
      authorizationUrl: `/checkout/mock?${params.toString()}`,
      providerRef: randomUUID(),
    };
  },

  async verify(reference) {
    return {
      status: "SUCCESS",
      amountCents: 0,
      currency: "NGN",
      providerRef: reference,
      paidAt: new Date(),
      raw: { mock: true, reference },
    };
  },

  parseWebhook(rawBody) {
    const body = JSON.parse(rawBody) as { event: string; data: { reference: string } };
    return {
      eventId: `${body.event}:${body.data.reference}`,
      eventType: body.event,
      reference: body.data.reference,
      raw: body,
    };
  },
};
