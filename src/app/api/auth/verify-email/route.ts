import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { consumeToken } from "@/lib/tokens";
import { verifyEmailSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export const POST = handler(async (req: NextRequest) => {
  const { token } = verifyEmailSchema.parse(await req.json());

  const record = await consumeToken(token, "EMAIL_VERIFICATION");
  if (!record) throw new ApiError(400, "INVALID_TOKEN", "This verification link is invalid or expired.");

  const user = await db.user.update({
    where: { id: record.userId },
    data: {
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
    },
  });

  await sendEmail({
    to: user.email,
    template: "welcome",
    subject: "Welcome to Career Forge",
    data: { name: user.name },
  });
  await audit({ actorId: user.id, action: "EMAIL_VERIFIED", entity: "User", entityId: user.id });

  return ok({ verified: true });
});
