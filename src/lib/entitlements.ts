import { db } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { resolvePermissions } from "@/lib/auth.config";

/**
 * Staff (any role carrying `tools:unlimited`) get unmetered AI usage and
 * premium CV exports with no paywall — so the team can build and demo the
 * product without paying itself.
 */
export async function hasUnlimitedTools(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { role: { select: { key: true } } } } },
  });
  if (!user) return false;
  const perms = resolvePermissions(user.roles.map((r) => r.role.key));
  return hasPermission(perms, "tools:unlimited");
}
