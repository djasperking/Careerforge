"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { MAINTENANCE_SECTIONS, saveMaintenance, type MaintenanceSection, type SectionState } from "@/lib/maintenance/service";

const sectionSchema = z.object({ off: z.boolean(), note: z.string().max(600) });

export async function saveMaintenanceAction(
  input: Partial<Record<MaintenanceSection, SectionState>>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requirePermissionApi("settings:write");
    const clean: Partial<Record<MaintenanceSection, SectionState>> = {};
    for (const key of Object.keys(MAINTENANCE_SECTIONS) as MaintenanceSection[]) {
      if (input[key]) clean[key] = sectionSchema.parse(input[key]);
    }
    await saveMaintenance(clean, admin.id);
    await audit({
      actorId: admin.id,
      action: "MAINTENANCE_UPDATED",
      entity: "SystemSetting",
      metadata: {
        off: (Object.keys(clean) as MaintenanceSection[]).filter((k) => clean[k]?.off),
      },
    });
    revalidatePath("/admin/maintenance");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not save. Please try again." };
  }
}
