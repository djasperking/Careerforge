import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation";
import { hashPassword, passwordIssues } from "@/lib/password";
import { consumeToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export const POST = handler(async (req: NextRequest) => {
  const ip = clientIp(req.headers);
  rateLimit(`reset:${ip}`, { windowSeconds: 900, max: 10 });

  const body = resetPasswordSchema.parse(await req.json());

  const issues = passwordIssues(body.password);
  if (issues.length) throw new ApiError(422, "WEAK_PASSWORD", `Password needs ${issues.join(", ")}.`);

  const record = await consumeToken(body.token, "PASSWORD_RESET");
  if (!record) throw new ApiError(400, "INVALID_TOKEN", "This reset link is invalid or expired.");

  const user = await db.user.update({
    where: { id: record.userId },
    data: { passwordHash: await hashPassword(body.password) },
  });

  // Invalidate any other outstanding reset tokens and active sessions.
  await db.verificationToken.updateMany({
    where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
    data: { usedAt: new Date() },
  });
  await db.authSession.deleteMany({ where: { userId: user.id } });

  await sendEmail({
    to: user.email,
    template: "password-changed",
    subject: "Your Career Forge password was changed",
    data: { name: user.name },
  });
  await audit({ actorId: user.id, action: "PASSWORD_RESET", entity: "User", entityId: user.id, ip });

  return ok({ reset: true });
});
