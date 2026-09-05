import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handler, ok } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation";
import { issueToken } from "@/lib/tokens";
import { sendEmail, appUrl } from "@/lib/email";

export const POST = handler(async (req: NextRequest) => {
  const ip = clientIp(req.headers);
  rateLimit(`forgot:${ip}`, { windowSeconds: 900, max: 5 });

  const { email } = forgotPasswordSchema.parse(await req.json());
  const user = await db.user.findUnique({ where: { email } });

  // Always return the same response regardless of whether the account exists.
  if (user && user.status !== "BANNED" && user.status !== "DELETED") {
    const token = await issueToken({
      userId: user.id,
      type: "PASSWORD_RESET",
      ttlMinutes: 60,
    });
    await sendEmail({
      to: user.email,
      template: "password-reset",
      subject: "Reset your Career Forge password",
      data: { name: user.name, link: appUrl(`/reset-password?token=${token}`) },
    });
  }

  return ok({ sent: true });
});
