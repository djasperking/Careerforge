"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ROLES } from "@/lib/rbac";

type Result = { ok: boolean; error?: string };

export async function setUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED" | "BANNED"): Promise<Result> {
  const admin = await requirePermissionApi("users:suspend");

  const target = await db.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.roles.some((r) => r.role.key === ROLES.SUPER_ADMIN)) {
    return { ok: false, error: "You cannot change a Super Admin's status." };
  }
  if (target.id === admin.id) return { ok: false, error: "You cannot change your own status." };

  await db.user.update({ where: { id: userId }, data: { status } });
  if (status !== "ACTIVE") {
    await db.authSession.deleteMany({ where: { userId } });
  }
  await audit({
    actorId: admin.id,
    action: `USER_${status}`,
    entity: "User",
    entityId: userId,
    metadata: { previous: target.status },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}
