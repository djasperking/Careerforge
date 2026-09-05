import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { authConfig } from "@/lib/auth.config";

/**
 * Full Auth.js (NextAuth v5) setup for server code (route handlers, RSC,
 * server actions). Extends the edge-safe `authConfig` with the Credentials
 * provider, which needs Prisma + bcrypt and therefore cannot run in middleware.
 *
 * Session strategy is JWT: the token carries roles + resolved permissions so
 * route guards are fast. Because JWTs can't be revoked server-side, the
 * page/API guards in `src/lib/session.ts` re-read the user's status and roles
 * from the database for anything sensitive — the DB stays authoritative.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: { roles: { include: { role: true } } },
        });
        if (!user || !user.passwordHash) return null;

        const okPw = await verifyPassword(password, user.passwordHash);
        if (!okPw) return null;

        if (["SUSPENDED", "BANNED", "DELETED"].includes(user.status)) {
          throw new Error(`ACCOUNT_${user.status}`);
        }

        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          status: user.status,
          roles: user.roles.map((r) => r.role.key),
          emailIsVerified: !!user.emailVerifiedAt,
        } as never;
      },
    }),
  ],
});
