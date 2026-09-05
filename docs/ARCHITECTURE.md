# Career Forge (CF) — System Architecture

> This document is the response to the spec's **"FIRST TASK FOR THE DEVELOPMENT AI"**:
> the 17-part architectural plan produced before large-scale implementation.
> Phase 1 (Foundation) is implemented in this repository; later phases are
> designed here and tracked in [ROADMAP.md](./ROADMAP.md).

---

## 1. Complete system architecture

Career Forge is a **modular monolith** built on Next.js (App Router). One
deployable application, internally split into independent domain modules that
each own their database tables, business logic, API surface and UI. Modules
communicate through typed service functions, never by reaching into each
other's tables.

```
                 ┌─────────────────────────────────────────────┐
   Browser  ───▶ │  Next.js App (Vercel / Node)                 │
   (React)       │                                             │
                 │  ┌── UI (RSC + Client Components) ──────────┐ │
                 │  │  Public site · Customer dashboard · Admin │ │
                 │  └──────────────────────────────────────────┘ │
                 │  ┌── Route handlers  /api/* ────────────────┐ │
                 │  │  auth users profile cv courses enrollments│ │
                 │  │  exams certificates payments subscriptions│ │
                 │  │  ai ads admin notifications support        │ │
                 │  └──────────────────────────────────────────┘ │
                 │  ┌── Domain services (src/lib, src/modules) ─┐ │
                 │  │  auth · rbac · cv · lms · exams · billing  │ │
                 │  │  ai (abstraction) · payments (abstraction) │ │
                 │  │  storage · email · notifications · audit   │ │
                 │  └──────────────────────────────────────────┘ │
                 │  ┌── Background jobs (queue worker) ─────────┐ │
                 │  │  grading · certificate gen · emails ·      │ │
                 │  │  subscription expiry · webhook retries     │ │
                 │  └──────────────────────────────────────────┘ │
                 └───────────┬───────────────┬─────────────┬─────┘
                             │               │             │
                     ┌───────▼──────┐ ┌──────▼─────┐ ┌─────▼──────────┐
                     │ PostgreSQL   │ │ Object     │ │ External APIs  │
                     │ (Prisma)     │ │ storage    │ │ Paystack       │
                     │              │ │ (S3/R2)    │ │ Anthropic      │
                     └──────────────┘ └────────────┘ │ SMTP / email   │
                                                     └────────────────┘
```

**Request lifecycle (every feature follows this):**

```
Frontend → API/Server Action → Authentication → Authorization (RBAC)
        → Input validation (zod) → Business logic → DB / External service
        → Consistent response → UI
```

**Why a modular monolith and not microservices:** the spec demands independent
maintainability and future extraction, not distributed-systems operational
overhead on day one. Clear module boundaries + an abstraction layer for every
external dependency mean any module (AI, payments, a future mobile BFF) can be
split into its own service later without a rewrite.

---

## 2. Recommended technology stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + React 19 | One codebase for SSR UI + API, RSC for fast dashboards, mature ecosystem |
| Language | **TypeScript** (strict) | Type safety across DB → API → UI |
| Database | **PostgreSQL 15+** | Relational integrity, JSON columns, full-text search, mature hosting |
| ORM | **Prisma 6** | Typed queries, migrations, schema as source of truth |
| Auth | **Auth.js (NextAuth v5)**, JWT sessions, Credentials provider | RBAC-friendly, OAuth/2FA-ready |
| Styling | **Tailwind CSS** + a local component library (CVA) | Consistent design system, no runtime cost |
| Validation | **zod** | Shared schemas for API + forms |
| AI | **Anthropic Claude** via `@anthropic-ai/sdk`, behind `src/lib/ai` | Swappable; keys server-side only |
| Payments | **Paystack** via REST + webhooks, behind `src/lib/payments` | Spec requirement; provider-agnostic interface |
| Storage | **S3-compatible** (Cloudflare R2 / AWS S3 / Cloudinary), behind `src/lib/storage` | Cheap, portable |
| Email | SMTP / provider behind `src/lib/email` | Console logger in dev |
| Background jobs | Queue worker (BullMQ + Redis, or Vercel Cron + a jobs table) | Grading, certificates, emails, expiry |
| PDF | `@react-pdf/renderer` or Puppeteer (Phase 2 decision) | CV export |
| Tests | Vitest (unit/integration), Playwright (e2e) | Spec requires all three |
| Hosting | Vercel (app) + Neon/Supabase (Postgres) + Upstash (Redis) | Scales horizontally; stateless app |

---

## 3. Database ERD / schema

Full schema: [`prisma/schema.prisma`](../prisma/schema.prisma). Narrative:
[DATABASE.md](./DATABASE.md).

**Domain groups (≈45 entities):**

- **Auth & RBAC** — `User`, `Role`, `Permission`, `RolePermission`, `UserRole`,
  `AuthSession`, `VerificationToken`
- **Profile** — `Profile`, `Education`, `Experience`, `ProfileCertification`, `Project`
- **CV** — `CVTemplate`, `CV`, `CVVersion`, `CVAnalysis`
- **LMS** — `Category`, `Course`, `CourseModule`, `Lesson`, `LessonResource`,
  `LessonNote`, `LessonBookmark`, `Enrollment`, `CourseProgress`, `Review`
- **Assessment** — `Quiz`, `Exam`, `Question`, `QuestionOption`, `ExamAttempt`,
  `ExamAnswer`, `ExamSecurityEvent`
- **Certificates** — `Certificate`
- **Billing** — `Transaction`, `PaymentWebhookEvent`, `SubscriptionPlan`,
  `Subscription`
- **AI** — `AIPrompt`, `AIRequest`, `AIUsage`
- **Advertising** — `AdCampaign`, `Advertisement`, `AdImpression`, `AdClick`
- **Comms** — `Notification`, `EmailLog`
- **Support** — `SupportTicket`, `TicketMessage`
- **CMS** — `ContentBlock`, `BlogPost`
- **Platform** — `AuditLog`, `SystemSetting`

Key relationships: `User 1—1 Profile`, `User M—N Role` (via `UserRole`),
`Course 1—N CourseModule 1—N Lesson`, `Exam 1—N Question 1—N QuestionOption`,
`ExamAttempt 1—N ExamAnswer`, `Transaction 1—N PaymentWebhookEvent`.
All money is stored as integer **minor units** (`amountCents`) + currency code.
Indexes on every foreign key and on status/date columns used for filtering.

---

## 4. Folder / project structure

```
career-forge/
├─ prisma/
│  ├─ schema.prisma        # all entities
│  └─ seed.ts              # demo/dev data (env-driven admin)
├─ docs/                   # architecture, DB, setup, roadmap, security
├─ src/
│  ├─ app/
│  │  ├─ (auth)/           # login, register, forgot/reset password
│  │  ├─ (dashboard)/      # customer area — guarded by layout
│  │  ├─ (admin)/          # admin console — guarded by layout + permissions
│  │  ├─ courses/          # public catalogue
│  │  ├─ verify/           # public certificate verification
│  │  ├─ api/              # route handlers, one folder per domain
│  │  ├─ layout.tsx  globals.css  error.tsx  not-found.tsx
│  ├─ components/
│  │  ├─ ui/               # design-system primitives
│  │  └─ layout/           # shell, sidebar, brand, nav config
│  ├─ lib/
│  │  ├─ auth.ts session.ts rbac.ts            # authn / authz
│  │  ├─ db.ts env.ts api.ts rate-limit.ts audit.ts
│  │  ├─ password.ts tokens.ts validation.ts utils.ts
│  │  ├─ ai/               # provider abstraction (anthropic | mock)
│  │  ├─ payments/         # provider abstraction (paystack | mock)
│  │  ├─ email/            # provider abstraction (console | smtp)
│  │  └─ storage/          # provider abstraction (local | s3)
│  ├─ modules/             # (Phase 2+) domain services: cv, lms, exams, billing
│  ├─ jobs/                # (Phase 2+) background job definitions
│  └─ types/               # shared + next-auth type augmentation
├─ tests/                  # unit / integration / e2e
├─ middleware.ts           # edge route guard (first line, not the boundary)
└─ .env.example
```

Rule: no file owns more than one responsibility; no cross-module table access.

---

## 5. Authentication architecture

- **Credentials (email + password)** now; provider slots ready for Google,
  Apple, Microsoft, phone OTP, and TOTP 2FA.
- Passwords hashed with **bcrypt (cost 12)**; plain text never stored or logged.
- **Email verification** and **password reset** use single-use, SHA-256-hashed,
  time-boxed tokens (`VerificationToken`). The raw token is only ever in the
  emailed link.
- **Sessions:** JWT strategy (7-day expiry). The token carries `uid`, `status`,
  `roles`, and resolved `permissions` so guards are DB-free on the hot path;
  `trigger: "update"` re-reads from the DB when roles change.
- **Account status** (`ACTIVE / PENDING / SUSPENDED / BANNED / DELETED`) checked
  at sign-in and in `requireUserApi`. Suspending a user deletes their sessions.
- **Protections:** per-IP rate limiting on register / login / forgot / reset;
  generic responses that don't reveal whether an account exists; secure
  cookies; CSRF handled by Auth.js; security-relevant events written to
  `AuditLog` and (Phase 9) emailed.
- **Layers of defence:** `middleware.ts` (edge redirect) → route/layout guards
  (`requireUser`, `requireAdmin`, `requirePermissionPage`) → per-action
  re-checks (`requireUserApi`, `requirePermissionApi`). The DB is always
  authoritative.

---

## 6. Admin architecture

- Separate route group `src/app/(admin)/admin/*`, guarded by an async layout
  calling `requireAdmin()`; every page additionally calls
  `requirePermissionPage(<key>)`.
- **Roles:** Super Admin, Admin, Course Manager, Finance Manager, Support
  Manager, Content Manager (+ Instructor, Customer). Stored in DB; the canonical
  seed mapping is in [`src/lib/rbac.ts`](../src/lib/rbac.ts). Permissions are
  fine-grained keys (`users:suspend`, `courses:publish`, `payments:refund`, …)
  and are **configurable** — the code checks keys, not role names.
- Sections: Dashboard, Users, Courses, Exams, Certificates, CV Templates, AI,
  Payments, Subscriptions, Advertisements, Content, Support, Analytics, Audit
  Logs, Settings. All routes + nav + guards exist now; management UIs land per
  phase.
- Every mutating admin action writes an `AuditLog` row (actor, action, entity,
  entityId, ip, metadata).

---

## 7. Customer architecture

- Route group `src/app/(dashboard)/dashboard/*`, guarded by `requireUser()`.
- Overview (profile completion, active courses, certificates, notifications,
  recent transactions), My CVs, AI Career Tools, My Learning, Exams,
  Certificates, Payments, Notifications, Profile.
- Server Components read data directly through Prisma; mutations use Server
  Actions (`profile`) or `/api/*` (auth) — both re-authenticate.
- Profile editing (name, headline, bio, contact, skills, interests, languages,
  public/private visibility) is fully implemented in Phase 1, including a
  server-computed completion percentage.

---

## 8. AI architecture

- **Single abstraction** `src/lib/ai` exposes provider-agnostic functions:
  `generateCV, analyzeCV, generateCoverLetter, careerAdvice,
  generateCourseOutline, generateQuestions, gradeAnswer, recommendCourses`.
- Providers: `anthropic` (real) and `mock` (deterministic, key-free) selected by
  `AI_PROVIDER`. Adding OpenAI/others = one new file implementing `AIProvider`.
- `withAIUsage(ctx, run)` wraps every call: checks the caller's **plan limit**
  (from `SubscriptionPlan.limits` — data, not code), records an `AIRequest`
  (tokens, latency, status) and increments monthly `AIUsage`. Over-limit →
  `429 AI_LIMIT_REACHED`.
- **Prompts** are stored and versioned in `AIPrompt` and admin-managed at
  `/admin/ai` (`src/lib/ai/prompts.ts` → `getActiveSystemPrompt`): the
  Anthropic provider looks up an active custom instruction for the calling
  feature key and layers it on top of the built-in safety rules, falling back
  to the built-in default instruction when nothing is configured.
- Customer-facing surfaces (`/dashboard/ai`): career assistant and interview
  coach (chat, client-held history passed per request — no server-side
  transcript storage), cover letter generator (from a selected CV), course
  recommendations (profile + not-yet-enrolled catalog).
- **Responsible AI:** system prompt forbids fabricating employment, degrees,
  certifications, licences or achievements; output is always marked
  `isAIGenerated`; suggestions needing user confirmation carry
  `requiresVerification`.
- Keys are server-only (`ANTHROPIC_API_KEY`), never sent to the client.

---

## 9. Payment architecture

- **Abstraction** `src/lib/payments` (`PaymentProvider`: `initCheckout`,
  `verify`, `parseWebhook`); providers `paystack` and `mock` (the local default
  — no external account needed to exercise the whole flow).
- **Orchestration** lives in `src/lib/billing/service.ts`, one module for both
  entry points:
  - `createCheckout` — resolves price/currency/description server-side from
    the course or plan record (never from client input), creates a `PENDING`
    `Transaction` with a unique reference, calls `initCheckout`.
  - `finalizeTransaction(reference)` — the single idempotent finish line,
    called from both the browser callback (`/dashboard/payments/callback`) and
    the webhook (`/api/webhooks/paystack`), whichever arrives first. Always
    re-verifies with the provider; a transaction already `SUCCESS` is never
    re-activated; a provider error is caught and stored as
    `VERIFICATION_FAILED` instead of throwing into the request.
  - `refundTransaction` — admin-only (`payments:refund`); only a `SUCCESS`
    transaction can be refunded; reverts the enrollment/subscription.
- **Webhooks:** signature verified (HMAC-SHA512, constant-time compare); every
  event stored in `PaymentWebhookEvent` with a unique `(provider, eventId)` →
  **idempotent**; duplicates are no-ops.
- The frontend is **never** authoritative — paid features activate only after
  server verification. Handles success / failure / abandoned / duplicate /
  refund / verification-failure.
- Secret keys server-only; only `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is exposed.

---

## 10. Course architecture

- `Course → CourseModule → Lesson → (Quiz / Exam)`. Lesson types: VIDEO, TEXT,
  PDF, QUIZ, ASSIGNMENT, EXAM. `LessonResource` for downloads.
- Publishing workflow: `DRAFT → PUBLISHED ⇄ UNPUBLISHED → ARCHIVED`. Instructor
  content requires admin approval.
- **Progress is server-validated:** `CourseProgress` rows are written by the API
  after sanity checks (e.g. minimum watch time); `Enrollment.progressPercent`
  and completion are recomputed server-side — the client cannot mark itself
  complete.
- Enrolment is created only after a verified `Transaction` (or free-course
  path). Recommendation engine (Phase 7) uses profile + activity, no sensitive
  inferences.

---

## 11. Examination architecture

- `Exam` config: time limit, question count, randomise questions/options,
  passing score, max attempts, availability window, grading mode, answer-reveal
  policy.
- **Server-authoritative:** on start, the server creates an `ExamAttempt` with
  `serverDeadline`, a unique `sessionId`, and a locked-in (optionally shuffled)
  `questionIds` set so a reload never re-randomizes. A second "start" call for
  the same exam/user resumes that attempt rather than creating a duplicate.
  Time remaining, auto-submit and scoring are computed from `serverDeadline`
  and stored answers — never from client-reported values; the attempt page
  independently checks the deadline on every load and finalizes an expired
  attempt itself, so leaving the tab open past time still gets graded.
- **Anti-cheating (defence in depth, honestly bounded):** client detectors for
  tab switch / focus loss / copy / paste / right-click post to the API, which
  records `ExamSecurityEvent` (user, exam, timestamp, type, occurrences,
  sessionId). Browser restrictions are a deterrent and an audit trail, **not** a
  guarantee — all rules are enforced server-side and admins review flagged
  attempts.
- Auto-grading for objective types; manual grading queue for essay/short-answer;
  `gradeAnswer()` (AI) can assist a human, never replace the final decision.

---

## 12. Certificate architecture

- On verified completion (every course lesson done, or an exam attempt graded
  as passed), `src/lib/certificate/service.ts` issues a `Certificate` with a
  human public id (`CF-XXXXXX`), student name, title and completion date.
  Issuance is idempotent — it checks for an existing certificate first, so a
  recomputed progress or a re-graded attempt never double-issues. The PDF
  (`src/lib/certificate/pdf.tsx`) is rendered on demand by
  `/api/certificates/[id]/pdf`, not pre-generated to storage.
- **Public verification:** `/verify` (enter id) and `/verify/CF-XXXXXX` (result)
  are live now — anyone can confirm authenticity or see "revoked / not found".
  No authentication, no PII beyond what's on the certificate.
- Certificates can be revoked (`revokedAt`) and reissued.

---

## 13. Advertisement architecture

- `AdCampaign → Advertisement`. Fields: creative (image/video), destination URL,
  placement, priority, start/end, `maxImpressions`, `maxClicks`, status.
- 9 placements: homepage, dashboard, course page, CV builder, blog, search
  results, sidebar, header, footer. `<AdSlot placement path>`
  (`src/components/ads/ad-slot.tsx`) is live on 4 of them today (homepage,
  dashboard, course detail, CV builder) — the rest are supported by the model
  and admin UI, just not yet placed on a page.
- Ad server (`src/lib/ads/service.ts` → `pickAdForPlacement`): given a
  placement, filters to ACTIVE ads within their date window, skips any at
  their impression/click cap, and returns the highest-priority (then newest)
  eligible one. `AdSlot` records an `AdImpression` on render and renders
  nothing when no ad qualifies — never a broken box. The click endpoint
  (`/api/ads/[id]/click`) records an `AdClick` then redirects to the
  destination URL. CTR = clicks / impressions, shown per-ad and account-wide
  in `/admin/ads`. `SystemSetting["ads.enabled"]` is a global kill switch,
  checked by the ad server on every pick (togglable in Settings).

---

## 14. API architecture

- Route handlers under `src/app/api/<domain>/…`:
  `auth, users, profile, cv, courses, enrollments, exams, certificates,
  payments, subscriptions, ai, ads, admin, notifications, support`.
- **Consistent envelope** (`src/lib/api.ts`):
  `{ ok: true, data }` or `{ ok: false, error: { code, message, details } }`.
- `handler()` wrapper turns `ApiError` / `ZodError` into clean responses and
  guarantees no stack trace leaks (generic `500 INTERNAL`).
- Proper HTTP methods and status codes (400/401/403/404/409/422/429/500).
- Every handler: authenticate → authorize → validate (zod) → act → audit
  (if mutating) → respond.

---

## 15. Security architecture

See [SECURITY.md](./SECURITY.md). Highlights:

- bcrypt password hashing; single-use hashed tokens; JWT sessions with status
  checks; RBAC with configurable permissions; three guard layers.
- zod validation on every input; Prisma parameterised queries (no raw SQL with
  user input); React auto-escaping; security headers in `next.config.mjs`;
  privacy-preserving cookie defaults.
- Per-IP rate limiting (pluggable → Redis in prod).
- File uploads validated for MIME, extension, size and caller permission
  (`src/lib/storage`).
- Payment webhook signature verification + idempotency.
- `AuditLog` for every sensitive action; security event logging for exams and
  auth.
- Secrets only in env / server; `NEXT_PUBLIC_*` is the only client surface.
- **Never trust the browser** for: payment status, exam timing, exam score,
  course completion, permissions, subscription status, certificate eligibility,
  AI usage limits.

---

## 16. Deployment architecture

- **App:** Vercel (or any Node host) — stateless, horizontally scalable.
- **DB:** managed Postgres (Neon / Supabase / RDS) with connection pooling
  (PgBouncer / Prisma Accelerate).
- **Cache / queue:** Redis (Upstash) for rate limiting + BullMQ jobs.
- **Storage:** Cloudflare R2 / S3 with a CDN in front.
- **Jobs:** a separate worker process (or Vercel Cron hitting protected
  endpoints) for grading, certificates, emails, subscription/exam expiry,
  webhook retries.
- **Environments:** local → preview (per-PR) → staging → production, each with
  its own DB and Paystack **test** keys outside production.
- **Observability:** structured logs, error tracking (Sentry), uptime + DB
  metrics, `/api/health`.
- **CI/CD:** typecheck + lint + unit/integration tests on PR; migrations run on
  deploy; e2e against preview.
- **Backups:** automated daily Postgres snapshots + PITR; periodic restore
  drills.
- See [SECURITY.md](./SECURITY.md) for the production go-live checklist.

---

## 17. Development roadmap

Detailed phase breakdown, exit criteria and the per-module workflow are in
[ROADMAP.md](./ROADMAP.md). Summary:

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation: setup, DB, auth, RBAC, design system, dashboards | **Implemented** |
| 2 | CV system: builder, templates, PDF, storage, AI assistant | **Implemented** |
| 3 | Course system: courses, modules, lessons, video, progress, enrolment | **Implemented** |
| 4 | Examination: questions, exams, timer, attempts, grading, security | **Implemented** |
| 5 | Certificates: generation + public verification | **Implemented** |
| 6 | Payments: Paystack, webhooks, transactions, subscriptions | **Implemented** |
| 7 | AI: assistant, CV analysis, recommendations, question generation | **Implemented** |
| 8 | Advertising: campaigns, placements, impressions, clicks, analytics | **Implemented** |
| 9 | Support / notifications: email, in-app notifications, tickets | **Implemented** |
| 10 | Production hardening: security, performance, testing, monitoring, backups | First pass done — see roadmap |

**Per-module workflow (the spec's Critical Development Rule):** explain
architecture → define models → define API → define components → define
authn/authz → define security → implement → test → fix → document → next.
