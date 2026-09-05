import { env } from "@/lib/env";
import { db } from "@/lib/db";

/**
 * Email abstraction. `console` provider logs to stdout and records an EmailLog
 * row — enough for development. Implement the `smtp` branch with nodemailer (or
 * a provider SDK) for production without touching call sites.
 */
export type EmailTemplate =
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "password-changed"
  | "payment-confirmation"
  | "course-enrollment"
  | "course-completion"
  | "exam-result"
  | "certificate-issued"
  | "subscription-notice"
  | "security-alert"
  | "support-reply";

export interface SendEmailInput {
  to: string;
  template: EmailTemplate;
  subject: string;
  data: Record<string, unknown>;
}

export async function sendEmail(input: SendEmailInput) {
  const log = await db.emailLog.create({
    data: {
      to: input.to,
      template: input.template,
      subject: input.subject,
      provider: env.EMAIL_PROVIDER,
      status: "queued",
    },
  });

  try {
    if (env.EMAIL_PROVIDER === "console") {
      console.info(
        `\n📧 [email:${input.template}] to=${input.to}\n   subject: ${input.subject}\n   data: ${JSON.stringify(input.data)}\n`,
      );
    } else {
      // TODO: nodemailer transport using SMTP_* env vars.
      throw new Error("SMTP email provider not configured");
    }
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: "sent", sentAt: new Date() },
    });
  } catch (err) {
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: "failed", error: (err as Error).message },
    });
    throw err;
  }
}

export function appUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}
