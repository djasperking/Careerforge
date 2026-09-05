# Career Forge — Development Roadmap

The spec forbids generating the whole platform in one step. Work proceeds
module by module, each following the **Critical Development Rule**:

1. Explain the architecture 2. Define DB models 3. Define API endpoints
4. Define frontend components 5. Define authn/authz 6. Define security
7. Implement 8. Test 9. Fix errors 10. Document 11. Next module

Do not rewrite working modules unnecessarily. No placeholder functionality where
real functionality is required. If a third-party service is unavailable, use the
existing clean abstraction/mock (`src/lib/{ai,payments,email,storage}`).

---

## Phase 1 — Foundation ✅ (this repository)

- [x] Project setup (Next.js, TypeScript, Tailwind design system, env validation)
- [x] Database schema for all ~45 entities (`prisma/schema.prisma`)
- [x] Auth: register, login, logout, verify email, forgot/reset password
- [x] RBAC: roles, permissions, configurable mapping, 3 guard layers
- [x] Customer dashboard shell + working profile management
- [x] Admin dashboard shell with live metrics + working user suspend/restore
- [x] Admin settings (system settings persisted, not hard-coded)
- [x] Audit logging + admin audit viewer
- [x] Public homepage, course catalogue, certificate verification
- [x] Abstractions: AI, payments, email, storage (with mock/console/local impls)
- [x] Seed data (env-driven admin, demo customer, templates, plans, course, exam)
- [x] Consistent API envelope + error handling

**Exit criteria met:** a user can register → verify → log in → edit profile;
an admin can log in → view metrics → suspend a user; all secrets server-side;
`npm run typecheck` passes.

---

## Phase 2 — CV System ✅

- [x] Section editor for all 13 sections (`src/components/cv/section-editors.tsx`)
- [x] Template engine + render config — one layout engine driven by
      `CVTemplate.config` (columns/font/spacing/sectionOrder), shared shape
      between the live preview and the PDF renderer
- [x] Live preview (`src/components/cv/cv-preview.tsx`) updating as you type
- [x] PDF export via `@react-pdf/renderer`, no headless browser
      (`src/lib/cv/pdf.tsx`, `/api/cv/[id]/pdf`)
- [x] Create / duplicate / delete / rename, versioned saves → `CVVersion`,
      version history with restore
- [x] AI: `generateCV` (professional-summary suggestion) and `analyzeCV`
      (match score, missing keywords/skills, weak sections, ATS recs, improved
      summary) — both go through `withAIUsage` for plan-limit enforcement
- [x] Accept/reject UX: every AI suggestion is badged "AI-generated — review
      before use" and only applied on explicit "Use this"
- [x] Plan gating, data-driven: CV count limit (`SubscriptionPlan.limits["cv:count"]`)
      and premium-template gating (`limits["cv:premiumTemplates"]`) —
      `src/lib/cv/service.ts`, enforced server-side in every CV action
- [x] Admin: CV template activate/deactivate + premium toggle
      (`/admin/cv-templates`)

**Exit criteria met:** create → edit all sections → live preview reflects
changes → AI summary suggested and accepted → save creates a version → PDF
downloads as a real, valid PDF → Free-plan CV limit blocks a 2nd CV with a
clear message. Verified in-browser end to end; `tsc`, `next lint`, `vitest`
(13 tests), `next build` all green.

## Phase 3 — Course System ✅

- [x] Admin course CRUD (`/admin/courses`): settings, category quick-add,
      publish/unpublish/archive/duplicate/delete (delete blocked once a course
      has enrollments — archive instead)
- [x] Curriculum management (`module-manager.tsx`): modules and lessons —
      create/edit/delete/reorder (position swap in a transaction), 6 lesson
      types, per-lesson free-preview flag
- [x] Public course detail page (`/courses/[slug]`) with objectives,
      requirements, curriculum outline, enrol button
- [x] Enrolment: free courses enrol instantly; paid courses are honestly
      blocked with "checkout arrives in Phase 6" rather than unlocked for free
- [x] Lesson player (`/dashboard/courses/[id]/lessons/[lessonId]`): video/text/PDF
      rendering, prev/next navigation
- [x] Server-authoritative progress: a heartbeat endpoint credits watch-time
      using the *server's* elapsed-time-since-last-heartbeat (capped at 20s),
      never a client-reported duration — see `/api/courses/[courseId]/lessons/[lessonId]/progress`
- [x] `recomputeCourseProgress` (`src/lib/course/service.ts`) recalculates
      `Enrollment.progressPercent` from `CourseProgress` rows and flips the
      enrollment to `COMPLETED` the moment every lesson is done — never
      trusting a client-sent percentage
- [x] Course completion triggers certificate issuance (see Phase 5)

**Exit criteria met:** admin creates a course, adds modules/lessons, publishes
it; a customer finds it in the catalogue, enrols, completes lessons with
progress tracked server-side. Interactive Quiz/Assignment lesson types are
scaffolded (type exists, shows an honest "not interactive yet" notice) —
deferred rather than faked.

## Phase 4 — Examination ✅

- [x] Admin exam builder (`/admin/exams/[id]`): settings (time limit, question
      count, passing score, max attempts, randomisation, grading mode, reveal
      policy), question bank (6 types) with inline create/edit/delete
- [x] AI question generator (`generateQuestions`) drafts questions into
      `reviewStatus: DRAFT`; admin approves or rejects before anything reaches
      a student — nothing AI-written ships unreviewed
- [x] Attempt flow: `startExamAttempt` locks in a server-picked (and, if
      configured, shuffled) question set into `ExamAttempt.questionIds` so a
      reload never re-randomizes; a second "start" resumes the existing
      in-progress attempt instead of creating a duplicate
- [x] Server-authoritative timing: `serverDeadline` set at start; the runner's
      countdown is a display only — the attempt page independently checks the
      deadline on every load and auto-finalizes an expired attempt itself
- [x] Anti-cheating signals (tab-switch, focus-loss, copy, paste, right-click)
      logged to `ExamSecurityEvent` — a deterrent and audit trail, not a
      guarantee; all grading rules are enforced server-side regardless
- [x] Autosaved answers (`saveExamAnswer`, debounced) survive a refresh;
      writes are rejected once the deadline passes
- [x] Auto-grading for objective questions (exact-match, incl. multi-select);
      essay/short-answer graded by AI when `gradingMode: AUTO`
      (`src/lib/exam/service.ts` → `autoGradeAttempt`), otherwise queued for
      the admin grading UI
- [x] `finalizeAttemptIfComplete` computes score/percentage/pass once every
      answer is graded and is safe to call repeatedly (auto-grade path and
      manual-grade path both call it)
- [x] Results view respects `revealAnswers` — correct answers/explanations
      only shown when the exam is configured to reveal them

**Exit criteria met:** admin builds an exam with AI-drafted + hand-written
questions, publishes it; a student starts it, answers, submits (or lets it
expire and gets auto-submitted), is auto-graded, and sees a result. Verified
end to end in-browser including a real pass → certificate issuance.

## Phase 5 — Certificates ✅

- [x] Verification pages: done in Phase 1
- [x] Automatic, idempotent issuance (`src/lib/certificate/service.ts`):
      `issueCourseCertificate` on course completion, `issueExamCertificate` on
      a passed exam attempt — both check for an existing certificate first, so
      re-triggering a completion never double-issues
- [x] Certificate PDF (`src/lib/certificate/pdf.tsx`, `/api/certificates/[id]/pdf`) —
      landscape, branded, with student name, title, completion date,
      certificate ID and the public verification URL
- [x] Admin certificate list (`/admin/certificates`) with revoke/restore
- [x] Dashboard certificate list has working PDF download + verification link

**Exit criteria met:** passing the demo exam issued a real certificate,
downloadable as a valid PDF and confirmed on the public `/verify/CF-XXXXXX`
page — verified in-browser.

## Phase 6 — Payments ✅

- [x] Single checkout entry point (`src/lib/billing/service.ts` → `createCheckout`):
      resolves price/currency/description **server-side** from the product
      record (course or plan) — never from client input — creates a `PENDING`
      `Transaction` with a unique reference, then calls the active payment
      provider's `initCheckout`
- [x] Browser callback (`/dashboard/payments/callback`) and webhook
      (`/api/webhooks/paystack`) both funnel through the same
      `finalizeTransaction(reference)` — idempotent (a `SUCCESS` transaction is
      never re-activated), and it **verifies with the provider** rather than
      trusting the redirect or the webhook payload's claimed status
- [x] Idempotent webhook handling via the `(provider, eventId)` unique
      constraint on `PaymentWebhookEvent` — a retried Paystack delivery is a
      safe no-op
- [x] Product activation is data-driven per `ProductType`: `COURSE` creates an
      `Enrollment`, `SUBSCRIPTION` cancels any prior active subscription and
      creates a new one for `subscriptionPeriodDays(billingPeriod)` (30 days
      monthly, 365 yearly) — courses already gate premium CV templates via
      `SubscriptionPlan.limits`, so a successful upgrade unlocks them with no
      extra code
- [x] Failure paths handled explicitly: FAILED/ABANDONED transactions are
      recorded as such (no activation); a provider error during verification
      is caught and stored as `VERIFICATION_FAILED` rather than crashing
- [x] Refunds (`refundTransaction`, `payments:refund` permission): only a
      `SUCCESS` transaction can be refunded; reverts the enrollment/subscription
      and notifies the customer
- [x] Admin reconciliation (`/admin/payments`): revenue/success/failure stats,
      transaction list with a Refund action, and a webhook-event inspector
- [x] Customer UI: paid-course "Enrol" and subscription "Upgrade" buttons both
      redirect to checkout; a receipt page per successful transaction; a
      payment-confirmation email/notification on success
- [x] Mock checkout page (`/checkout/mock`, done in Phase 1) lets the whole
      flow run with zero external accounts — `PAYMENT_PROVIDER=mock` is now
      the default so `npm run preview` exercises it out of the box
- [x] Admin subscription-plan editor — price, billing period, features,
      active flag (data-driven, nothing hard-coded)

**Exit criteria met:** bought a paid demo course and upgraded to Career Plus
through the mock checkout end to end (enrollment/subscription activated,
receipt generated); refunded the course purchase and watched the enrollment
flip to REFUNDED and admin revenue recalculate — all verified in-browser.

## Phase 7 — AI ✅

- [x] Career assistant chat (`/dashboard/ai`, "Career assistant" tab) —
      per-request conversation context (last 10 turns) passed to `careerAdvice`
- [x] Interview coach — same chat engine, a distinct mode/feature key and framing
- [x] Cover letter generator — drafts from a selected CV + job description,
      never inventing facts not in the CV; "AI-generated — review before
      sending"
- [x] Course recommendation engine — profile skills/interests + catalog →
      `recommendCourses`, filtered to not-yet-enrolled courses, with an honest
      empty state when there's nothing new to suggest
- [x] CV analyzer — done in Phase 2 (`analyzeCV`)
- [x] AI exam-question generator with review queue — done in Phase 4
- [x] Admin AI config — provider/model/usage stats at `/admin/ai` (still env-driven,
      per spec's "server-side environment/configuration" for secrets)
- [x] Versioned prompt editor (`AIPrompt`) — admins create/activate per-feature
      system-prompt overrides (`src/lib/ai/prompts.ts`); Career Forge's safety
      rules (never fabricate history, mark AI content) always apply underneath,
      regardless of what's configured
- [x] Every AI feature routes through `withAIUsage` for plan-limit enforcement
      and `AIRequest`/`AIUsage` logging — unchanged from Phase 1/2

**Exit criteria met:** asked the career assistant a question and got a reply;
generated a cover letter from a real CV; requested course recommendations and
got a correct empty state; created and activated a custom prompt version for
"Career assistant" as admin and saw the stored-prompts counter update — all
verified in-browser.

## Phase 8 — Advertising ✅

- [x] Campaign CRUD (`/admin/ads`) — create, activate/pause/archive
- [x] Ad CRUD within a campaign (`/admin/ads/[id]`) — placement, priority,
      impression/click caps, activate/pause/delete
- [x] Ad serving (`src/lib/ads/service.ts` → `pickAdForPlacement`) — highest
      priority first, respects date window and caps, honours the global
      `ads.enabled` system setting (toggle already in Settings from Phase 1)
- [x] Server-rendered `<AdSlot>` component records an impression on render and
      renders nothing when no ad qualifies — never a broken placeholder; wired
      into 4 real placements: homepage, customer dashboard, course detail page,
      CV builder (the model supports all 9 spec placements; the rest have no
      live page slot yet)
- [x] Click tracking (`/api/ads/[id]/click`) records the click then redirects
      to the destination URL
- [x] CTR shown per-ad and account-wide in the admin UI

**Exit criteria met:** created a campaign and an ad targeting the homepage,
activated both, saw the ad render live on the homepage, clicked through, and
watched impressions/clicks/CTR update in the admin view — verified in-browser.

## Phase 9 — Support / Notifications ✅

- [x] In-app notification centre (`/dashboard/notifications`) — mark one or
      all as read, with an unread-count badge on the sidebar nav item
      (`src/components/layout/sidebar-nav.tsx`, fed from the dashboard layout)
- [x] Notifications + emails fire at the right lifecycle points: enrolment,
      course completion, exam result, certificate issued, support replies —
      `course-completion` and `exam-result` templates wired up this pass
      (welcome/verify/reset/payment templates were already live from Phase 1)
- [x] Support tickets, customer side (`/dashboard/support`) — create a ticket,
      view own tickets, reply (internal notes are never shown to the customer)
- [x] Support tickets, admin side (`/admin/support`) — full thread including
      internal notes, reply or add an internal note, status workflow, assign
      to any admin-role user
- [x] A customer-visible admin reply flips the ticket back to `PENDING` and
      notifies + emails the customer automatically

**Exit criteria met:** customer opened a ticket → admin saw it, assigned/replied
→ customer received a notification and could see the reply → notification
badge counted it and cleared on "mark all read" — verified in-browser.

## Phase 10 — Production Hardening 🟡 (first pass done; deployment itself is next)

Done this pass:

- [x] Content-Security-Policy header added alongside the existing
      X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy
      (`next.config.mjs`) — verified in-browser with zero violations across the
      homepage, dashboard and checkout flow. Uses `'unsafe-inline'`/`'unsafe-eval'`
      for Next's own bootstrap/dev-overlay scripts; tighten with a per-request
      nonce before a real launch
- [x] Rate limiting extended to checkout initiation (`checkout:<userId>`, 10/min)
      alongside the auth/lesson-progress limits already in place from earlier
      phases
- [x] Dependency audit pass: bumped `next` 15.1.3 → 15.5.25 and `next-auth`
      beta.25 → beta.32 (both same-major, low-risk patches) plus one transitive
      fix, cutting `npm audit`'s findings from 13 to 10 — all verified via a
      full `tsc`/`lint`/`vitest`/`next build` pass afterward. The remaining 10
      all require forcing `next` to a v16 major or `vitest` to v5, which is a
      deliberate line not crossed today — see "Known issues" below
- [x] Additional unit tests for Phase 6 (`subscriptionPeriodDays`, mock payment
      provider) — 22 tests total, all green
- [x] Billing-critical amounts are always server-computed (from the course/plan
      record), never accepted from client input — re-confirmed while building
      Phase 6

Still open (real work, not done today):

- Security/pen-test pass beyond this session's review; a per-request CSP nonce
- Performance: caching strategy, query budgets, image optimisation, code-splitting
- Full test suites: integration tests and e2e coverage of the critical journeys
  (unit coverage exists; integration/e2e do not yet)
- Monitoring & alerting (error tracking, uptime, DB metrics) — `/api/health`
  exists but nothing consumes it yet
- Automated backups + restore drills
- The `next`/`vitest` major-version bumps parked above
- Deployment itself — infra, CI/CD, environments — **intentionally saved for
  a later session** by request

See the full checklist in [SECURITY.md](./SECURITY.md).

---

## Critical customer journeys to cover with e2e tests

1. Register → verify email → login → build CV → buy course → enrol → complete
   lessons → pass exam → receive certificate → verify certificate publicly
2. Admin login → create course → publish → customer purchases → payment verified
   → course unlocked
