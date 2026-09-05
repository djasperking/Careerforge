import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { isAdminRole } from "@/lib/rbac";

/**
 * Edge guard: a fast first line of defence using only the signed JWT (no DB).
 * It is NOT the authorization boundary — every server action, API route and
 * protected page re-checks authentication, account status and permissions
 * against the database (see src/lib/session.ts).
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const roles = (req.auth?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const path = nextUrl.pathname;

  const isDashboard = path.startsWith("/dashboard");
  const isAdmin = path.startsWith("/admin");
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].some((p) =>
    path.startsWith(p),
  );

  if ((isDashboard || isAdmin) && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (isAdmin && isLoggedIn && !isAdminRole(roles)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register", "/forgot-password", "/reset-password"],
};
