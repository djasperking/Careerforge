"use server";

import { revalidatePath } from "next/cache";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { sendWeeklyDigest } from "@/lib/newsletter/service";

export async function sendDigestNow(): Promise<{ ok: true; sent: number; skipped: string } | { ok: false; error: string }> {
  try {
    const admin = await requirePermissionApi("content:write");
    const result = await sendWeeklyDigest({ force: true });
    await audit({ actorId: admin.id, action: "NEWSLETTER_SENT", entity: "NewsletterSubscriber", metadata: { sent: result.sent } });
    revalidatePath("/admin/newsletter");
    return { ok: true, ...result };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Send failed. Check the logs." };
  }
}
