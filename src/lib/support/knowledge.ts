import { db } from "@/lib/db";
import { cvUnlockPrice } from "@/lib/cv/service";
import { formatPriceCents } from "@/lib/currency";

/**
 * What the support assistant is allowed to say. Everything here is either a
 * fixed fact about how Career Forge works (matching the Terms and Refund
 * Policy) or a live value read from the database, so the assistant never has
 * to guess a price or a rule.
 */
const STATIC_KNOWLEDGE = `
ABOUT
Career Forge (careerforge.com.ng) is an education and career-tools platform: an AI CV builder, online courses with verifiable certificates, exams, a free curated jobs board, 1-on-1 coaching, a marketplace of digital products (ebooks, templates, videos), and a referral/credits system. Career Forge does not hire — the jobs board links to employers' own application pages.

ACCOUNT
- Sign up at /register (email + password, or Google). Verify your email from the link we send; use "Resend verification" on the dashboard if it did not arrive (check spam).
- Forgot password: /forgot-password sends a reset link.
- Profile and email preferences are under Dashboard > Profile.

CV BUILDER (Dashboard > CV Builder)
- Create a CV from scratch, or upload a PDF/Word CV and it is read into editable fields (reading is free). Pick a template; some templates are Premium.
- Free plan: 1 CV, with a watermark on exports. Paid subscribers and one-time unlocks get clean (un-watermarked) PDFs; subscription plans can allow more CVs and premium templates.
- The "Analyze against this job" tool and AI writing tools use AI credits/limits depending on your plan.

COURSES, EXAMS, CERTIFICATES
- Browse courses at /courses. Free courses enrol directly; paid courses are bought at checkout (Paystack). Some courses run as scheduled classes (cohorts) with live sessions and a class link.
- Your courses are under Dashboard > My Learning; exams and certificates are under Dashboard > Learning.
- Certificates have a public verification page and can be downloaded as PDF.

JOBS BOARD (/jobs)
- Free. Filter by work mode, type and category. "Apply" opens the employer's own page. We do not process applications.

COACHING
- Book 1-on-1 sessions at /coaching. You pay at booking, suggest times, and the coach confirms a time and sends a meeting link; check Dashboard > My Purchases.

DIGITAL PRODUCTS
- Buy at /products. Instant download or watch on Career Forge from My Purchases.

REFERRALS AND CREDITS
- Dashboard > Refer & earn has your referral link. Account credit comes from referrals, a welcome bonus for people who join through a referral link, and following our social pages (claim on the Dashboard). Credit is applied automatically at checkout, only to courses and CV unlocks, and only on Naira (NGN) checkouts.

PAYMENTS
- Payments are processed by Paystack. Some items can be paid in USD when a USD price is set; use the "Pay in $ instead" link by the price.
- Payment history and receipts: Dashboard > Payments. If you were charged but did not get access, create a ticket with your payment reference.

REFUNDS (official policy)
- Courses: full refund within 7 days of purchase if no more than 20% completed and no certificate issued. After that, non-refundable (unless materially not as described).
- Digital products: non-refundable once downloaded, unless faulty/corrupt/not as described.
- One-time CV unlock: non-refundable once used; if it failed to unlock after payment, we fix it or refund.
- Subscriptions: cancel any time to stop the next renewal; no pro-rata of the current period; charges after cancelling or in error are refunded.
- Coaching: full refund if cancelled 48+ hours before the session or if the coach cannot confirm a time; no refund for no-shows or late cancellations unless the coach agrees.
- To request a refund: email support@careerforge.com.ng from your account email with the order reference and reason; we aim to reply within 3 business days; approved refunds take 5-10 business days to appear.

SUPPORT
- For anything about your own account, a payment, a refund decision, a bug, or anything not covered above, the user should create a support ticket (the chat has a "Create a ticket" button) — a person replies in Dashboard > Support. You cannot look up accounts, payments or orders.
`.trim();

/** Static facts plus live prices, as one block of text for the prompt. */
export async function buildSupportKnowledge(): Promise<string> {
  const lines: string[] = [STATIC_KNOWLEDGE, "", "LIVE PRICES AND PLANS"];
  try {
    const [ngn, usd, plans] = await Promise.all([
      cvUnlockPrice("NGN"),
      cvUnlockPrice("USD"),
      db.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { position: "asc" } }),
    ]);
    lines.push(`- One-time CV unlock (one CV, clean export): ${formatPriceCents(ngn.amountCents, "NGN")}${usd.currency === "USD" ? ` or ${formatPriceCents(usd.amountCents, "USD")}` : ""}.`);
    for (const p of plans) {
      const price = p.priceCents > 0 ? `${formatPriceCents(p.priceCents, "NGN")}${p.billingPeriod && p.billingPeriod !== "none" ? ` per ${p.billingPeriod.replace(/ly$/, "")}` : ""}` : "free";
      lines.push(`- Plan "${p.name}": ${price}${p.features.length ? `. Includes: ${p.features.slice(0, 5).join("; ")}` : ""}.`);
    }
  } catch {
    lines.push("- (Live prices are unavailable right now; do not quote prices — tell the user to check the pricing on the site.)");
  }
  return lines.join("\n");
}
