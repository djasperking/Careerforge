import type { PermissionKey } from "@/lib/rbac";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      status: string;
      roles: string[];
      permissions: PermissionKey[] | "*";
      emailIsVerified: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    status?: string;
    roles?: string[];
    permissions?: PermissionKey[] | "*";
    emailIsVerified?: boolean;
  }
}
