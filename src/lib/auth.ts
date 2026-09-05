import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { authConfig } from "@/lib/auth.config";
import { resolvePermissions } from "@/lib/auth.config";
import { ROLES } from "@/lib/rbac";

/**
 * Full Auth.js (NextAuth v5) setup for server code (route handlers, RSC,
 * server actions). Extends the edge-safe `authConfig` with providers that need
 * Prisma + bcrypt and therefore cannot run in middleware.
 *
 * Session strategy is JWT: the token carries roles + resolved permissions so
 * route guards are fast. Because JWTs can't be revoked server-side, the
 * page/API guards in `src/lib/session.ts` re-read the user's status and roles
 * from the database for anything sensitive — the DB stays authoritative.
 */

const BLOCKED = ["SUSPENDED", "BANNED", "DELETED"];

interface TokenUser {
  id: string;
  status: string;
  roles: string[];
  emailIsVerified: boolean;
}

async function loadUserByEmail(email: string): Promise<TokenUser | null> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { roles: { include: { role: true } } },
  });
  if (!user) return null;
  return {
    id: user.id,
    status: user.status,
    roles: user.roles.map((r) => r.role.key),
    emailIsVerified: !!user.emailVerifiedAt,
  };
}

/** Link a Google sign-in to an account by its verified email, creating one on
 * first use. Google has already verified the address, so the new account is
 * active with email confirmed. */
async function upsertGoogleUser(profile: {
  email: string;
  name?: string | null;
  picture?: string | null;
}) {
  const email = profile.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.emailVerifiedAt || (!existing.image && profile.picture)) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
          image: existing.image ?? profile.picture ?? null,
          status: existing.status === "PENDING" ? "ACTIVE" : existing.status,
        },
      });
    }
    return;
  }

  const customerRole = await db.role.upsert({
    where: { key: ROLES.CUSTOMER },
    update: {},
    create: { key: ROLES.CUSTOMER, name: "Customer", isSystem: true },
  });
  await db.user.create({
    data: {
      email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      roles: { create: { roleId: customerRole.id } },
      profile: { create: {} },
    },
  });
}

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

        if (BLOCKED.includes(user.status)) {
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
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email || profile.email_verified === false) return false;
        await upsertGoogleUser({
          email: profile.email,
          name: profile.name,
          picture: (profile as { picture?: string }).picture ?? null,
        });
      }
      return true;
    },
    async jwt(params) {
      const { token, account, profile } = params;
      if (account?.provider === "google" && profile?.email) {
        const dbUser = await loadUserByEmail(profile.email);
        if (dbUser) {
          token.uid = dbUser.id;
          token.status = dbUser.status;
          token.roles = dbUser.roles;
          token.emailIsVerified = dbUser.emailIsVerified;
          token.permissions = resolvePermissions(dbUser.roles);
        }
        return token;
      }
      return authConfig.callbacks!.jwt!(params);
    },
    session: authConfig.callbacks!.session!,
  },
});
