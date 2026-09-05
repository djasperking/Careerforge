import type { NextAuthConfig } from "next-auth";
import { ROLE_PERMISSIONS, type PermissionKey, type RoleKey } from "@/lib/rbac";

/**
 * Edge-safe Auth.js config: NO database, NO bcrypt, NO Node-only APIs.
 * This is what `middleware.ts` loads. The full config in `auth.ts` spreads
 * this and adds the Credentials provider (which needs Prisma + bcrypt).
 */

export function resolvePermissions(roleKeys: string[]): PermissionKey[] | "*" {
  if (roleKeys.some((r) => ROLE_PERMISSIONS[r as RoleKey] === "*")) return "*";
  const set = new Set<PermissionKey>();
  for (const r of roleKeys) {
    const perms = ROLE_PERMISSIONS[r as RoleKey];
    if (perms && perms !== "*") perms.forEach((p) => set.add(p));
  }
  return [...set];
}

export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login", error: "/login" },
  trustHost: true,
  providers: [], // real providers are added in auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          status: string;
          roles: string[];
          emailIsVerified: boolean;
        };
        token.uid = u.id;
        token.status = u.status;
        token.roles = u.roles;
        token.emailIsVerified = u.emailIsVerified;
        token.permissions = resolvePermissions(u.roles);
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.status = (token.status as string) ?? "PENDING";
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissions = (token.permissions as PermissionKey[] | "*") ?? [];
        session.user.emailIsVerified = Boolean(token.emailIsVerified);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
