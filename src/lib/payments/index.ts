import { env } from "@/lib/env";
import type { PaymentProvider } from "./types";
import { paystackProvider } from "./paystack";
import { mockPaymentProvider } from "./mock";

export * from "./types";

export function getPaymentProvider(): PaymentProvider {
  switch (env.PAYMENT_PROVIDER) {
    case "paystack":
      return paystackProvider;
    default:
      return mockPaymentProvider;
  }
}

/** Idempotency-friendly reference: <type>_<userId-short>_<time>_<rand>. */
export function newPaymentReference(productType: string, userId: string) {
  return `${productType.toLowerCase()}_${userId.slice(0, 8)}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
