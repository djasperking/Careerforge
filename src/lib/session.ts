import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { hasPermission, isAdminRole, type PermissionKey } from "@/lib/rbac";
import { resolvePermissions } from "@/lib/auth.config";

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  status: string;
  roles: string[];
  permissions: PermissionKey[] | "*";
  emailIsVerified: boolean;
}

/** Session view straight from the JWT — fast, best-effort, may be slightly stale. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  return session?.user ? (session.user as CurrentUser) : null;
}

/**
 * Authoritative check: re-reads status + roles from the database. Use this for
 * anything that grants access or mutates data — it catches suspensions and role
 * changes that a still-valid JWT would otherwise miss.
 */
async function loadAuthoritative(userId: string): Promise<CurrentUser | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return null;
  const roles = user.roles.map((r) => r.role.key);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    status: user.status,
    roles,
    permissions: resolvePermissions(roles),
    emailIsVerified: !!user.emailVerifiedAt,
  };
}

const BLOCKED = ["SUSPENDED", "BANNED", "DELETED"];

// ---- Server components / pages: redirect on failure -----------------------

export async function requireUser(): Promise<CurrentUser> {
  const jwtUser = await getCurrentUser();
  if (!jwtUser) redirect("/login");
  const user = await loadAuthoritative(jwtUser.id);
  if (!user || BLOCKED.includes(user.status)) redirect("/login?blocked=1");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isAdminRole(user.roles)) redirect("/dashboard");
  return user;
}

export async function requirePermissionPage(permission: PermissionKey): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user.permissions, permission)) redirect("/dashboard");
  return user;
}

// ---- API routes / server actions: throw structured errors -----------------

export async function requireUserApi(): Promise<CurrentUser> {
  const jwtUser = await getCurrentUser();
  if (!jwtUser) throw new ApiError(401, "UNAUTHENTICATED", "Sign in required.");
  const user = await loadAuthoritative(jwtUser.id);
  if (!user || BLOCKED.includes(user.status)) {
    throw new ApiError(403, "ACCOUNT_BLOCKED", "Your account is not active.");
  }
  return user;
}

export async function requirePermissionApi(permission: PermissionKey): Promise<CurrentUser> {
  const user = await requireUserApi();
  if (!hasPermission(user.permissions, permission)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to do that.");
  }
  return user;
}
