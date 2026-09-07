import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/email";

/** Referral entry point: /r/<code> — remembers the referrer, then sends the
 * visitor to sign up. The cookie is read once, at registration. */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const clean = code.trim().toLowerCase().slice(0, 20);
  const referrer = await db.user.findUnique({ where: { referralCode: clean }, select: { id: true } });

  if (referrer) {
    (await cookies()).set("cf_ref", clean, {
      maxAge: 60 * 60 * 24 * 45,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return Response.redirect(appUrl(referrer ? "/register?r=1" : "/"), 302);
}
