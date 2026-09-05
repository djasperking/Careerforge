import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handler, ok } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { requireUserApi } from "@/lib/session";
import { issueToken } from "@/lib/tokens";
import { sendEmail, appUrl } from "@/lib/email";

export const POST = handler(async (req: NextRequest) => {
  const user = await requireUserApi();
  rateLimit(`resend-verify:${user.id}`, { windowSeconds: 900, max: 3 });
  rateLimit(`resend-verify-ip:${clientIp(req.headers)}`, { windowSeconds: 900, max: 10 });

  if (user.emailIsVerified) return ok({ sent: false, alreadyVerified: true });

  const record = await db.user.findUnique({ where: { id: user.id } });
  if (!record) return ok({ sent: false });

  const token = await issueToken({
    userId: record.id,
    type: "EMAIL_VERIFICATION",
    ttlMinutes: 60 * 24,
  });
  await sendEmail({
    to: record.email,
    template: "verify-email",
    subject: "Verify your Career Forge email",
    data: { name: record.name, link: appUrl(`/verify-email?token=${token}`) },
  });

  return ok({ sent: true });
});
