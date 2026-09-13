import { cookies, headers } from "next/headers";

export type BuyerCurrency = "NGN" | "USD";

export const CURRENCY_COOKIE = "cf_currency";

/**
 * The currency a buyer should see/pay in: their own explicit choice (a
 * cookie set by the currency toggle) if they've made one, otherwise a guess
 * from Vercel's edge-provided country header — Nigeria sees Naira, everyone
 * else sees USD. Geo-detection is imperfect, which is exactly why the toggle
 * exists: it always wins over the guess.
 */
export async function detectCurrency(): Promise<BuyerCurrency> {
  const cookieStore = await cookies();
  const override = cookieStore.get(CURRENCY_COOKIE)?.value;
  if (override === "NGN" || override === "USD") return override;

  const h = await headers();
  const country = h.get("x-vercel-ip-country");
  if (country && country !== "NG") return "USD";
  return "NGN";
}

/** Format a price already resolved for the given currency (amount is in
 * minor units — kobo for NGN, cents for USD). */
export function formatPriceCents(amountCents: number, currency: BuyerCurrency): string {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100);
}
