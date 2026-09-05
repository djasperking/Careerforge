import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handler, ok, ApiError } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
import { hashPassword, passwordIssues } from "@/lib/password";
import { issueToken } from "@/lib/tokens";
import { sendEmail, appUrl } from "@/lib/email";
import { audit } from "@/lib/audit";
import { ROLES } from "@/lib/rbac";

export const POST = handler(async (req: NextRequest) => {
  const ip = clientIp(req.headers);
  rateLimit(`register:${ip}`, { windowSeconds: 600, max: 10 });

  const body = registerSchema.parse(await req.json());

  const registrationOpen = await db.systemSetting.findUnique({
    where: { key: "auth.registrationOpen" },
  });
  if (registrationOpen && registrationOpen.value === false) {
    throw new ApiError(403, "REGISTRATION_CLOSED", "Registration is currently closed.");
  }

  const issues = passwordIssues(body.password);
  if (issues.length) {
    throw new ApiError(422, "WEAK_PASSWORD", `Password needs ${issues.join(", ")}.`);
  }

  const existing = await db.user.findUnique({ where: { email: body.email } });
  if (existing) {
    // Do not reveal whether an account exists.
    return ok({ registered: true });
  }

  const customerRole = await db.role.upsert({
    where: { key: ROLES.CUSTOMER },
    update: {},
    create: { key: ROLES.CUSTOMER, name: "Customer", isSystem: true },
  });

  const user = await db.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash: await hashPassword(body.password),
      status: "PENDING",
      roles: { create: { roleId: customerRole.id } },
      profile: { create: {} },
    },
  });

  const token = await issueToken({
    userId: user.id,
    type: "EMAIL_VERIFICATION",
    ttlMinutes: 60 * 24,
  });

  let emailSent = true;
  try {
    await sendEmail({
      to: user.email,
      template: "verify-email",
      subject: "Verify your Career Forge email",
      data: { name: user.name, link: appUrl(`/verify-email?token=${token}`) },
    });
  } catch (err) {
    // Account is created; the user can request a fresh link from the dashboard.
    emailSent = false;
    console.error("register: verification email failed", err);
  }

  await audit({ actorId: user.id, action: "USER_REGISTERED", entity: "User", entityId: user.id, ip });

  return ok({ registered: true, emailSent });
});
