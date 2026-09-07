/**
 * Legal page content. Plain Markdown, rendered by src/lib/markdown.ts.
 * These are working drafts written for a Nigerian EdTech platform — have a
 * lawyer review them before relying on them. Edit the text here (or move it to
 * a ContentBlock later for admin editing).
 */

export const LEGAL_LAST_UPDATED = "7 September 2026";

type LegalDoc = { slug: string; title: string; description: string; body: string };

const COMPANY = "Career Forge";
const SITE = "careerforge.com.ng";
const CONTACT = "support@careerforge.com.ng";

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    description: "The rules for using Career Forge.",
    body: `Last updated: ${LEGAL_LAST_UPDATED}

These Terms of Service ("Terms") govern your use of ${COMPANY} at ${SITE} and any related services (the "Platform"). By creating an account or using the Platform you agree to these Terms. If you do not agree, do not use the Platform.

## 1. What Career Forge is

${COMPANY} is an education and career-tools platform. We provide AI-assisted CV building, online courses, exams, certificates, 1-on-1 coaching, a marketplace for instructor-created digital products, and a curated jobs board.

**We are not an employer or a recruitment agency.** The jobs board lists openings at other companies as a convenience. We do not guarantee interviews, offers, or employment, and we are not a party to any application or hiring decision. Some job links may be partner or referral links; where that is the case it is disclosed on the listing.

## 2. Your account

- You must provide accurate information and be at least 16 years old (or the age of digital consent where you live).
- You are responsible for activity under your account and for keeping your password secure.
- One person, one account. Do not share accounts or resell access.
- We may suspend or close accounts that break these Terms, on notice where reasonably practicable.

## 3. Payments

- Prices are shown before checkout and charged through our payment processor, Paystack. We do not store your full card details.
- Course and digital-product purchases give you a licence to access that content for your personal, non-commercial use. Subscriptions renew automatically until cancelled.
- You are responsible for any taxes that apply to you.
- Refunds are governed by our [Refund Policy](/legal/refund).

## 4. Certificates

Certificates confirm that you completed a course or passed an exam on the Platform on a given date. They are not accredited qualifications and do not certify competence to any third party. Each certificate has a public verification page. We may revoke a certificate obtained through cheating, fraud, or error.

## 5. Instructors and the marketplace

- Instructors are independent creators, not employees or agents of ${COMPANY}.
- Instructors are responsible for their content being accurate, lawful, and their own (or properly licensed).
- We review submissions before they go live but do not endorse or guarantee any instructor content, and we are not liable for it.
- Instructor earnings, revenue share, and payouts are described in the instructor dashboard and are paid after a clearance period, subject to valid payout details and applicable law.

## 6. Acceptable use

You agree not to:

- copy, scrape, resell, or redistribute Platform content or other users' data;
- cheat on exams, share exam answers, or misrepresent your identity or achievements;
- upload malware or attempt to break, overload, or gain unauthorised access to the Platform;
- post unlawful, infringing, hateful, or misleading content;
- use the Platform to spam or harass others.

## 7. Intellectual property

The Platform, its software, design, and ${COMPANY} branding belong to us. Course and product content belongs to the relevant instructor or to us. Content you create (such as your CV) belongs to you; you grant us a limited licence to store and process it to provide the service.

## 8. AI features

Some features use AI to draft or analyse text. AI output can be wrong or incomplete. It is a starting point, not advice — review everything before you rely on it. We do not fabricate employment history, and AI-generated text is labelled as such, but you are responsible for what you submit.

## 9. Availability and changes

We aim to keep the Platform available but do not promise it will be uninterrupted or error-free. We may change, suspend, or discontinue features. We may update these Terms; material changes will be notified by email or on the Platform, and continued use after that means you accept them.

## 10. Liability

To the fullest extent allowed by law, ${COMPANY} is not liable for indirect or consequential loss, lost profit, lost opportunity, or loss of data, and our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim. Nothing in these Terms limits liability that cannot be limited by law.

## 11. Governing law

These Terms are governed by the laws of the Federal Republic of Nigeria, and disputes are subject to the courts of Nigeria.

## 12. Contact

Questions about these Terms: [${CONTACT}](mailto:${CONTACT}).`,
  },

  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "What data Career Forge collects and how it is used.",
    body: `Last updated: ${LEGAL_LAST_UPDATED}

This Privacy Policy explains how ${COMPANY} ("we") collects, uses, and protects your personal data when you use ${SITE}. We process personal data in line with the Nigeria Data Protection Act 2023 (NDPA) and, where it applies, other data-protection law.

## 1. Data we collect

**You give us:**

- account details — name, email, password (hashed), and any profile information you add;
- content you create — CVs, uploaded documents, course work, exam answers, messages;
- payment details — processed by Paystack; we receive a transaction reference and status, not your full card number;
- instructor details — bio, expertise, and bank details for payouts, if you become an instructor.

**We collect automatically:**

- usage data — pages viewed, actions taken, approximate device and browser information;
- log data — IP address and timestamps, for security and abuse prevention;
- limited cookies — for sign-in sessions and core functionality.

## 2. How we use it

- to provide and operate the Platform (your account, courses, CVs, certificates, payments);
- to run AI features you choose to use (your input is sent to our AI provider to generate a result);
- to process payments and instructor payouts;
- to send service messages (receipts, security alerts, course updates) and, if you opt in, the weekly newsletter;
- to keep the Platform secure and investigate fraud or abuse;
- to comply with legal obligations.

We do **not** sell your personal data.

## 3. Legal bases

We rely on: performance of our contract with you (to run the service); your consent (marketing email, optional features); our legitimate interests (security, improving the Platform); and legal obligation (tax, records).

## 4. Sharing

We share data only with:

- **service providers** who help us run the Platform — hosting (Vercel), database (Neon), payments (Paystack), email (Brevo), and our AI provider — under contract and only as needed;
- **instructors**, limited to what they need to deliver a course or coaching session you bought (for example your name and progress);
- **authorities**, where required by law.

Job "Apply" links take you to third-party sites with their own privacy practices; some may be partner links, which is disclosed on the listing.

## 5. Retention

We keep personal data for as long as your account is active and then for as long as needed for legal, tax, and dispute-resolution purposes, after which it is deleted or anonymised. You can delete most content (such as CVs) yourself at any time.

## 6. Your rights

Under the NDPA you can ask us to: access the data we hold about you; correct it; delete it; restrict or object to processing; and receive a copy in a portable format. You can also withdraw consent (for example, unsubscribe from email) at any time. To exercise these rights, contact [${CONTACT}](mailto:${CONTACT}). You have the right to complain to the Nigeria Data Protection Commission.

## 7. Security

Passwords are hashed, traffic is encrypted in transit, payment card data never touches our servers, and access to production data is limited. No system is perfectly secure; if a breach affects you we will notify you and the regulator as required.

## 8. International transfers

Some providers process data outside Nigeria. Where that happens we rely on the provider's contractual safeguards and applicable transfer mechanisms.

## 9. Children

The Platform is not for children under 16. We do not knowingly collect their data.

## 10. Changes and contact

We may update this Policy; material changes will be notified. Questions or requests: [${CONTACT}](mailto:${CONTACT}).`,
  },

  {
    slug: "refund",
    title: "Refund Policy",
    description: "When you can get a refund on Career Forge.",
    body: `Last updated: ${LEGAL_LAST_UPDATED}

This Refund Policy is part of our [Terms of Service](/legal/terms). It covers purchases made on ${SITE}.

## Courses

- You can request a **full refund within 7 days** of purchase **if you have completed no more than 20% of the course** and have not been issued a certificate.
- After 7 days, or once you pass 20% completion, course purchases are non-refundable.
- If a course is materially not as described, or is removed by us before you finish it, contact support for a full or pro-rata refund.

## Digital products (ebooks, templates, files)

Because these are delivered instantly and cannot be returned, they are **non-refundable** once downloaded — unless the file is faulty, corrupt, or materially not as described, in which case you get a full refund.

## One-time CV unlock

The CV watermark-removal / export unlock is **non-refundable** once used, because it delivers immediately. If it fails to unlock after payment, contact support and we will fix it or refund you.

## Subscriptions

- You can cancel any time; cancellation stops the next renewal. We do not pro-rate the current period.
- If you were charged after cancelling, or charged in error, we refund that charge in full.

## Coaching sessions

- Full refund if you cancel **at least 48 hours** before the scheduled time, or if the coach cannot confirm a time.
- No refund for no-shows or cancellations inside 48 hours, unless the coach agrees.

## Jobs board

The jobs board is free. There is nothing to refund. Applying to a job is done on the employer's own site.

## How to request a refund

Email [${CONTACT}](mailto:${CONTACT}) from your account email with your order reference and the reason. We aim to respond within 3 business days. Approved refunds go back to your original payment method through Paystack and can take 5–10 business days to appear.

## Chargebacks

Please contact us before raising a chargeback with your bank — most issues are resolved faster directly. Fraudulent chargebacks may result in account suspension.`,
  },
];

export function getLegalDoc(slug: string) {
  return LEGAL_DOCS.find((d) => d.slug === slug) ?? null;
}
