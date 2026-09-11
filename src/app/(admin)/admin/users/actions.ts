"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermissionApi } from "@/lib/session";
import { audit } from "@/lib/audit";
import { ROLES, ADMIN_ROLES, ROLE_NAMES, type RoleKey } from "@/lib/rbac";
import { issueToken } from "@/lib/tokens";
import { sendEmail, appUrl } from "@/lib/email";

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

/**
 * Set a user's staff role. `roleKey: null` removes any staff role, leaving them
 * a plain customer (their INSTRUCTOR status, if any, is untouched — that's a
 * separate track). Only ADMIN_ROLES are ever assigned here.
 */
export async function setUserRole(userId: string, roleKey: RoleKey | null): Promise<Result> {
  const admin = await requirePermissionApi("users:roles");

  if (roleKey && !ADMIN_ROLES.includes(roleKey)) {
    return { ok: false, error: "Not a valid staff role." };
  }
  if (roleKey === ROLES.SUPER_ADMIN && admin.permissions !== "*") {
    return { ok: false, error: "Only a Super Admin can grant Super Admin." };
  }
  if (userId === admin.id) {
    return { ok: false, error: "You can't change your own role here." };
  }

  const target = await db.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
  if (!target) return { ok: false, error: "User not found." };
  if (target.roles.some((r) => r.role.key === ROLES.SUPER_ADMIN) && admin.permissions !== "*") {
    return { ok: false, error: "Only a Super Admin can change a Super Admin's role." };
  }

  const adminRoleIds = target.roles.filter((r) => (ADMIN_ROLES as string[]).includes(r.role.key)).map((r) => r.roleId);

  await db.$transaction(async (tx) => {
    if (adminRoleIds.length) {
      await tx.userRole.deleteMany({ where: { userId, roleId: { in: adminRoleIds } } });
    }
    if (roleKey) {
      const role = await tx.role.upsert({
        where: { key: roleKey },
        update: {},
        create: { key: roleKey, name: ROLE_NAMES[roleKey], isSystem: true },
      });
      await tx.userRole.create({ data: { userId, roleId: role.id } });
    }
  });

  await audit({ actorId: admin.id, action: "USER_ROLE_SET", entity: "User", entityId: userId, metadata: { role: roleKey } });
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Re-send the email-verification link to a user (e.g. one stuck on PENDING). */
export async function resendVerificationEmail(userId: string): Promise<Result> {
  const admin = await requirePermissionApi("users:suspend");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "User not found." };
  if (user.emailVerifiedAt) return { ok: false, error: "This email is already verified." };
  if (user.deletedAt) return { ok: false, error: "This account has been deleted." };

  const token = await issueToken({ userId: user.id, type: "EMAIL_VERIFICATION", ttlMinutes: 60 * 24 });
  try {
    await sendEmail({
      to: user.email,
      template: "verify-email",
      subject: "Verify your Career Forge email",
      data: { name: user.name, link: appUrl(`/verify-email?token=${token}`) },
    });
  } catch (err) {
    console.error("admin resend verification failed", err);
    return { ok: false, error: "The email could not be sent. Try again shortly." };
  }

  await audit({ actorId: admin.id, action: "USER_VERIFICATION_RESENT", entity: "User", entityId: userId });
  return { ok: true };
}

/**
 * Delete a user account (right-to-erasure). Soft delete: personal data is
 * scrubbed and the account is hidden, but the row is kept so financial and
 * audit records stay intact. Super-admin only.
 */
export async function deleteUserAccount(userId: string, reason?: string): Promise<Result> {
  const admin = await requirePermissionApi("users:delete");
  const target = await db.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.roles.some((r) => r.role.key === ROLES.SUPER_ADMIN)) {
    return { ok: false, error: "You cannot delete a Super Admin." };
  }
  if (target.id === admin.id) return { ok: false, error: "You cannot delete your own account here." };
  if (target.deletedAt) return { ok: false, error: "This account is already deleted." };

  await db.$transaction([
    db.authSession.deleteMany({ where: { userId } }),
    db.verificationToken.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
        email: `deleted-${userId}@deleted.invalid`,
        name: null,
        image: null,
        passwordHash: null,
        emailVerifiedAt: null,
      },
    }),
  ]);

  await audit({
    actorId: admin.id,
    action: "USER_DELETED",
    entity: "User",
    entityId: userId,
    metadata: { formerEmail: target.email, reason: reason?.trim().slice(0, 500) || null },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}
