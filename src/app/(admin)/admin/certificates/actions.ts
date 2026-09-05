"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";

export async function revokeCertificate(id: string) {
  const admin = await requirePermissionApi("courses:write");
  await db.certificate.update({ where: { id }, data: { revokedAt: new Date() } });
  await audit({ actorId: admin.id, action: "CERTIFICATE_REVOKED", entity: "Certificate", entityId: id });
  revalidatePath("/admin/certificates");
}

export async function restoreCertificate(id: string) {
  const admin = await requirePermissionApi("courses:write");
  await db.certificate.update({ where: { id }, data: { revokedAt: null } });
  await audit({ actorId: admin.id, action: "CERTIFICATE_RESTORED", entity: "Certificate", entityId: id });
  revalidatePath("/admin/certificates");
}
