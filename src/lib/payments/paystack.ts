import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";
import type {
  InitCheckoutInput,
  InitCheckoutResult,
  PaymentProvider,
  VerifyResult,
  WebhookEvent,
} from "./types";

const BASE = "https://api.paystack.co";

function secret() {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new ApiError(500, "PAYMENTS_NOT_CONFIGURED", "Paystack secret key is not set.");
  }
  return env.PAYSTACK_SECRET_KEY;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!res.ok || !json.status) {
    throw new ApiError(502, "PAYSTACK_ERROR", json.message || "Paystack request failed");
  }
  return json.data;
}

/**
 * Paystack provider. Amounts are sent in the smallest currency unit (kobo/cents),
 * which is exactly how we store them, so no conversion is needed.
 */
export const paystackProvider: PaymentProvider = {
  name: "paystack",

  async initCheckout(input: InitCheckoutInput): Promise<InitCheckoutResult> {
    const data = await api<{ authorization_url: string; reference: string }>(
      "/transaction/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          reference: input.reference,
          email: input.email,
          amount: input.amountCents,
          currency: input.currency,
          callback_url: input.callbackUrl,
          metadata: input.metadata ?? {},
        }),
      },
    );
    return {
      provider: "paystack",
      authorizationUrl: data.authorization_url,
      providerRef: data.reference,
    };
  },

  async verify(reference: string): Promise<VerifyResult> {
    const data = await api<{
      status: string;
      amount: number;
      currency: string;
      reference: string;
      paid_at: string | null;
    }>(`/transaction/verify/${encodeURIComponent(reference)}`);

    const map: Record<string, VerifyResult["status"]> = {
      success: "SUCCESS",
      failed: "FAILED",
      abandoned: "ABANDONED",
    };
    return {
      status: map[data.status] ?? "PENDING",
      amountCents: data.amount,
      currency: data.currency,
      providerRef: data.reference,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      raw: data,
    };
  },

  parseWebhook(rawBody: string, signature: string | null): WebhookEvent {
    const key = env.PAYSTACK_WEBHOOK_SECRET || env.PAYSTACK_SECRET_KEY;
    if (!key) throw new ApiError(500, "PAYMENTS_NOT_CONFIGURED", "No webhook secret.");
    const expected = createHmac("sha512", key).update(rawBody).digest("hex");
    const provided = signature ?? "";
    const valid =
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!valid) throw new ApiError(401, "BAD_SIGNATURE", "Invalid webhook signature");

    const body = JSON.parse(rawBody) as {
      event: string;
      data: { id: number; reference: string };
    };
    return {
      eventId: `${body.event}:${body.data.id}`,
      eventType: body.event,
      reference: body.data.reference,
      raw: body,
    };
  },
};
