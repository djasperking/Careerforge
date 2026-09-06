import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { renderEmail } from "./templates";

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
  | "digital-product-ready"
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

let transporter: Transporter | null = null;

function getTransport(): Transporter {
  if (!env.SMTP_HOST) {
    throw new Error("EMAIL_PROVIDER=smtp but SMTP_HOST is not set");
  }
  if (!transporter) {
    const port = env.SMTP_PORT ?? 587;
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
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
      const { html, text } = renderEmail(input.template, input.data);
      await getTransport().sendMail({
        from: env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        text,
        html,
      });
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
