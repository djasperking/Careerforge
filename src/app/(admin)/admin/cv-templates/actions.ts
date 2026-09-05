"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";

export async function toggleTemplateActive(id: string, isActive: boolean) {
  const admin = await requirePermissionApi("cv:templates");
  await db.cVTemplate.update({ where: { id }, data: { isActive } });
  await audit({
    actorId: admin.id,
    action: isActive ? "CV_TEMPLATE_ACTIVATED" : "CV_TEMPLATE_DEACTIVATED",
    entity: "CVTemplate",
    entityId: id,
  });
  revalidatePath("/admin/cv-templates");
  revalidatePath("/dashboard/cvs");
}

export async function toggleTemplatePremium(id: string, isPremium: boolean) {
  const admin = await requirePermissionApi("cv:templates");
  await db.cVTemplate.update({ where: { id }, data: { isPremium } });
  await audit({
    actorId: admin.id,
    action: isPremium ? "CV_TEMPLATE_MARKED_PREMIUM" : "CV_TEMPLATE_MARKED_STANDARD",
    entity: "CVTemplate",
    entityId: id,
  });
  revalidatePath("/admin/cv-templates");
  revalidatePath("/dashboard/cvs");
}
