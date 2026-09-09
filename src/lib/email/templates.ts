import { env } from "@/lib/env";
import type { EmailTemplate } from "./index";

/**
 * Plain, deliverable HTML for transactional email. No external CSS/images —
 * inline styles only, single column, safe across mail clients. Each template
 * returns a heading, one or more paragraphs and an optional call-to-action.
 */

interface Block {
  heading: string;
  lines: string[];
  cta?: { label: string; url: string };
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

function block(template: EmailTemplate, data: Record<string, unknown>): Block {
  const name = data.name ? esc(data.name) : "there";
  switch (template) {
    case "verify-email":
      return {
        heading: "Confirm your email",
        lines: [
          `Hi ${name},`,
          "Confirm this address to activate your Career Forge account. This link expires in 24 hours.",
        ],
        cta: { label: "Verify email", url: String(data.link) },
      };
    case "welcome":
      return {
        heading: "Welcome to Career Forge",
        lines: [`Hi ${name},`, "Your email is confirmed and your account is active. You can now build a CV, enrol in courses and sit exams."],
        cta: { label: "Go to your dashboard", url: appUrl("/dashboard") },
      };
    case "password-reset":
      return {
        heading: "Reset your password",
        lines: [
          `Hi ${name},`,
          "We received a request to reset your password. This link expires in 1 hour. If you didn't ask for this, you can ignore this email.",
        ],
        cta: { label: "Choose a new password", url: String(data.link) },
      };
    case "password-changed":
      return {
        heading: "Your password was changed",
        lines: [
          `Hi ${name},`,
          "This is a confirmation that your Career Forge password was just changed. If this wasn't you, contact support immediately.",
        ],
      };
    case "payment-confirmation":
      return {
        heading: "Payment received",
        lines: [
          `Reference: ${esc(data.reference)}`,
          `${esc(data.description)} — ${esc(data.amount ?? "")}`,
          "Thank you for your purchase.",
        ],
      };
    case "digital-product-ready":
      return {
        heading: data.isVideo ? "Your video is ready to watch" : "Your download is ready",
        lines: [
          `Hi ${name},`,
          data.isVideo
            ? `Thanks for your purchase of <strong>${esc(data.productTitle)}</strong>. Use the button below to watch it on Career Forge — the link stays active, so you can come back to it any time.`
            : `Thanks for your purchase of <strong>${esc(data.productTitle)}</strong>. Use the button below to download ${esc(data.fileName) || "your file"} — the link stays active, so you can come back to it any time.`,
          data.isGuest
            ? `We created a Career Forge account for this email so your purchases are always available. Set a password here to sign in: ${esc(data.claimUrl)}`
            : "You can also find this under My Purchases in your dashboard.",
        ],
        cta: { label: data.isVideo ? "Watch now" : "Download now", url: String(data.downloadUrl) },
      };
    case "newsletter-digest":
      return {
        heading: String(data.title || "This week on Career Forge"),
        lines: [
          ...(data.intro ? [esc(data.intro)] : []),
          ...((data.sections as string[] | undefined) ?? []),
          `<span style="font-size:12px;color:#a1a1aa;">You're getting this because you subscribed at careerforge.com.ng. <a href="${esc(data.unsubscribeUrl)}" style="color:#a1a1aa;">Unsubscribe</a>.</span>`,
        ],
        cta: { label: "Visit Career Forge", url: appUrl("/") },
      };
    case "job-matches":
      return {
        heading:
          Number(data.count) === 1 ? "A new job matches your CV" : `${esc(data.count)} new jobs match your CV`,
        lines: [
          `Hi ${name},`,
          "Based on the skills and experience in your CV, these roles were posted this week:",
          String(data.jobsHtml ?? ""),
          `<span style="font-size:12px;color:#a1a1aa;">You're getting this because you have a CV on Career Forge. <a href="${esc(
            data.unsubscribeUrl,
          )}" style="color:#a1a1aa;">Turn off job alerts</a>.</span>`,
        ],
        cta: { label: "See all jobs this week", url: String(data.browseUrl) },
      };
    case "course-enrollment":
      return {
        heading: "You're enrolled",
        lines: [`You now have access to ${esc(data.courseTitle)}. Pick up where you left off any time from your dashboard.`],
        cta: { label: "Start learning", url: appUrl("/dashboard/courses") },
      };
    case "course-completion":
      return {
        heading: "Course complete",
        lines: [`Hi ${name},`, `You've completed ${esc(data.courseTitle)}. Well done.`],
        cta: { label: "View your progress", url: appUrl("/dashboard/courses") },
      };
    case "exam-result":
      return {
        heading: "Your exam result",
        lines: [
          `Hi ${name},`,
          `${esc(data.examTitle)}: ${esc(data.percentage)}% — ${data.passed ? "passed" : "not passed"}.`,
        ],
        cta: { label: "See details", url: appUrl("/dashboard/exams") },
      };
    case "certificate-issued":
      return {
        heading: "Your certificate is ready",
        lines: [`Hi ${name},`, `Your certificate for ${esc(data.courseTitle)} has been issued.`],
        cta: { label: "View certificate", url: appUrl(`/verify/${esc(data.certificateId)}`) },
      };
    case "subscription-notice":
      return {
        heading: "Subscription update",
        lines: [esc(data.message) || "There's an update to your Career Forge subscription."],
        cta: { label: "Manage subscription", url: appUrl("/dashboard/payments") },
      };
    case "security-alert":
      return {
        heading: "Security alert",
        lines: [esc(data.message) || "We noticed activity on your account that you should review."],
      };
    case "support-reply":
      return {
        heading: "Reply from support",
        lines: [esc(data.body) || "Our support team has replied to your ticket."],
        cta: { label: "View the conversation", url: appUrl("/dashboard/support") },
      };
    default:
      return { heading: "Career Forge", lines: ["You have a new notification."] };
  }
}

function appUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

export function renderEmail(
  template: EmailTemplate,
  data: Record<string, unknown>,
): { html: string; text: string } {
  const b = block(template, data);
  const brand = env.NEXT_PUBLIC_APP_NAME || "Career Forge";
  const logoUrl = new URL("/email-logo.png", env.NEXT_PUBLIC_APP_URL).toString();

  const text = [
    b.heading,
    "",
    ...b.lines,
    ...(b.cta ? ["", `${b.cta.label}: ${b.cta.url}`] : []),
    "",
    "—",
    brand,
  ].join("\n");

  const paragraphs = b.lines
    .map((l) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">${l}</p>`)
    .join("");

  const button = b.cta
    ? `<p style="margin:24px 0;">
         <a href="${esc(b.cta.url)}" style="display:inline-block;background:#3446cb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 24px;border-radius:8px;">${esc(b.cta.label)}</a>
       </p>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#71717a;word-break:break-all;">Or paste this link into your browser:<br>${esc(b.cta.url)}</p>`
    : "";

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:#ffffff;border-radius:12px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">
                <img src="${esc(logoUrl)}" width="44" height="44" alt="${esc(brand)}" style="display:block;border:0;border-radius:10px;width:44px;height:44px;" />
              </td>
              <td style="vertical-align:middle;font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#18181b;">${esc(brand)}</td>
            </tr>
          </table>
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:#18181b;">${esc(b.heading)}</h1>
          ${paragraphs}
          ${button}
          <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa;">You received this email because of activity on your ${esc(brand)} account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, text };
}
