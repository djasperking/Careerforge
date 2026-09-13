"use server";

import { cookies } from "next/headers";
import { CURRENCY_COOKIE, type BuyerCurrency } from "@/lib/currency";

export async function setCurrencyAction(currency: BuyerCurrency): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CURRENCY_COOKIE, currency, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
