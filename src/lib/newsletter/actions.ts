"use server";

import { headers } from "next/headers";
import { ApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { subscribe } from "./service";

export async function subscribeAction(email: string, source?: string): Promise<{ ok: true; already: boolean } | { ok: false; error: string }> {
  try {
    const ip = clientIp(await headers());
    rateLimit(`newsletter:${ip}`, { windowSeconds: 300, max: 8 });
    const res = await subscribe(email, source);
    return { ok: true, already: res.already };
  } catch (err) {
    if (err instanceof ApiError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
