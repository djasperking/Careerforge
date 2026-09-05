"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";

const schema = z.object({
  siteName: z.string().min(1).max(120),
  contactEmail: z.string().email().or(z.literal("")),
  currency: z.string().min(3).max(3),
  registrationOpen: z.union([z.literal("on"), z.literal("")]).optional(),
  requireEmailVerification: z.union([z.literal("on"), z.literal("")]).optional(),
  adsEnabled: z.union([z.literal("on"), z.literal("")]).optional(),
});

export type SettingsState = { ok?: boolean; error?: string };

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requirePermissionApi("settings:write");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please check the form." };
  const d = parsed.data;

  const entries: [string, unknown][] = [
    ["general.siteName", d.siteName],
    ["general.contactEmail", d.contactEmail],
    ["general.currency", d.currency.toUpperCase()],
    ["auth.registrationOpen", d.registrationOpen === "on"],
    ["auth.requireEmailVerification", d.requireEmailVerification === "on"],
    ["ads.enabled", d.adsEnabled === "on"],
  ];

  await db.$transaction(
    entries.map(([key, value]) =>
      db.systemSetting.upsert({
        where: { key },
        create: { key, value: value as never, updatedBy: admin.id },
        update: { value: value as never, updatedBy: admin.id },
      }),
    ),
  );

  await audit({ actorId: admin.id, action: "SETTINGS_UPDATED", entity: "SystemSetting" });
  revalidatePath("/admin/settings");
  return { ok: true };
}
