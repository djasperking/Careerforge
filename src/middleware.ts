import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

/**
 * Edge guard: a fast first line of defence using only the signed JWT (no DB).
 * It is NOT the authorization boundary — every server action, API route and
 * protected page re-checks authentication, account status and permissions
 * against the database (see src/lib/session.ts).
 *
 * Deliberately does NOT gate /admin by role here: the JWT's roles are frozen
 * at login and don't update when an admin changes someone's role mid-session,
 * so a role-based edge redirect would bounce a freshly-promoted user back to
 * /dashboard until they log out and in again. requireAdmin() on the actual
 * admin layout reads roles fresh from the database on every request, so it's
 * both the real authorization boundary and immediately correct.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const path = nextUrl.pathname;

  const isDashboard = path.startsWith("/dashboard");
  const isAdmin = path.startsWith("/admin");
  const isInstructor = path.startsWith("/instructor");
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].some((p) =>
    path.startsWith(p),
  );

  if ((isDashboard || isAdmin || isInstructor) && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*", "/admin/:path*", "/instructor/:path*",
    "/login", "/register", "/forgot-password", "/reset-password",
  ],
};
