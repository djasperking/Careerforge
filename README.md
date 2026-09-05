# Career Forge (CF)

**Build Your Career. Forge Your Future.**

An all-in-one career, education, assessment and CV/resume platform: AI-powered
CV building, online courses, secure online examinations, verifiable
certificates, payments (Paystack), subscriptions, advertising, and a full admin
console — built as a scalable commercial SaaS/EdTech platform.

> Built to the *Career Forge Master Full-Stack Web Application Development
> Prompt*. That spec is a 10-phase programme and explicitly says **not** to
> generate the whole platform in one step. This repository has **Phases 1–9
> implemented** (Foundation, CV System, Course System, Examination,
> Certificates, Payments, AI, Advertising, Support/Notifications) plus a first
> Phase 10 hardening pass. **Deployment itself is intentionally saved for a
> later session**, by request.

## What's implemented now

### Phase 6 — Payments

- One checkout entry point (`src/lib/billing/service.ts`) for both paid
  courses and subscription upgrades — price/currency always resolved
  server-side from the product record, never trusted from the client
- The browser callback and the Paystack webhook both funnel through the same
  idempotent `finalizeTransaction`, so whichever arrives first wins and a
  transaction is never activated twice
- Refunds (admin-only) revert the enrollment/subscription; an admin
  reconciliation view shows revenue, transactions, a Refund action and a
  webhook-event inspector
- Runs with **zero external accounts** by default — `PAYMENT_PROVIDER=mock`
  drives a local mock checkout page so the whole buy → activate → refund loop
  is exercisable without Paystack keys; verified end to end in-browser

### Phase 10 — Production Hardening (first pass)

- Content-Security-Policy header added (verified with zero violations across
  the app); rate limiting extended to checkout initiation
- Bumped `next` and `next-auth` to their latest same-major patches, cutting
  `npm audit`'s findings from 13 to 10 (the rest need a `next` v16 or `vitest`
  v5 major bump — deliberately not done today)
- 22 unit tests passing (`tsc`, lint and `next build` all green throughout)
- Full checklist of what's still open (performance, e2e tests, monitoring,
  backups, the deferred major bumps) is in [docs/SECURITY.md](docs/SECURITY.md)

### Phases 7–9 — AI, Advertising, Support & Notifications

- **AI** — a career-assistant/interview-coach chat, a cover-letter generator
  that drafts from a real CV, and a course-recommendation engine, all on top
  of the Phase 1/2/4 AI abstraction (plan-limited usage, request logging).
  Admins can version and activate custom system-prompt overrides per feature
  at `/admin/ai` — Career Forge's anti-fabrication safety rules always apply
  underneath whatever an admin configures
- **Advertising** — admin campaign/ad management (placements, priority, date
  windows, impression/click caps), a server-rendered `<AdSlot>` live on the
  homepage, customer dashboard, course pages and the CV builder that records
  impressions and renders nothing when no ad qualifies, click tracking with
  redirect, and CTR reporting — respecting a global on/off switch
- **Support & Notifications** — customers open and reply to support tickets;
  admins see the full thread (including internal notes customers never see),
  reply, assign, and change status; a customer-visible reply auto-notifies and
  emails the customer. An in-app notification centre with mark-read/mark-all
  and an unread-count badge on the sidebar. Course-completion and exam-result
  emails now fire alongside the existing welcome/verify/reset/payment ones.

### Phases 3–5 — Courses, Examinations, Certificates

- **Courses** — admin course/module/lesson builder with reordering and a
  publish workflow; public catalogue and course detail pages; free-course
  instant enrolment (paid courses are honestly gated behind Phase 6, not
  unlocked for free); a lesson player (video/text/PDF) whose progress is
  tracked by a **server-clocked heartbeat** — the server credits watch-time
  from its own elapsed time between requests, capped per tick, so a client
  can't just report "100% watched"
- **Examinations** — admin exam builder with 6 question types, an AI question
  generator whose drafts require explicit admin approval before they can ever
  reach a student, and an attempt runner with a **server-authoritative
  deadline** (locked-in randomized question set, autosaved answers, automatic
  finalization of an expired attempt even if the student never returns),
  anti-cheating event logging (tab-switch/focus-loss/copy/paste/right-click),
  auto-grading for objective questions and AI-assisted grading for
  essay/short-answer, plus an admin manual-grading queue
- **Certificates** — automatic, idempotent issuance on course completion or a
  passed exam, a real branded PDF, and admin revoke/restore — verified
  end-to-end in-browser: pass an exam → certificate appears → downloads as a
  valid PDF → confirms on the public `/verify/CF-XXXXXX` page

### Phase 2 — CV System

- Section-by-section CV editor (all 13 spec sections) with a live preview
  that updates as you type
- One template engine drives both the on-screen preview and the PDF export
  from each `CVTemplate`'s layout config — no per-template code
- Real PDF export (`@react-pdf/renderer`, no headless browser)
- Create / duplicate / delete / rename, versioned saves with restore
- AI professional-summary suggestions and CV-vs-job-description analysis
  (match score, missing keywords/skills, ATS tips) — every suggestion is
  labelled "AI-generated — review before use" and only applied on explicit
  accept
- Plan-based limits (CV count, premium templates) read from
  `SubscriptionPlan.limits` — nothing hard-coded
- Admin: activate/deactivate and premium-flag CV templates

### Phase 1 — Foundation

- **Auth** — register, email verification, login/logout, forgot/reset password,
  bcrypt hashing, hashed single-use tokens, rate limiting, account-status gating
- **RBAC** — DB-stored roles & fine-grained permissions, configurable mapping,
  three enforcement layers (edge middleware → page guards → per-action checks)
- **Customer dashboard** — overview with live data + fully working profile editor
- **Admin console** — live platform metrics, working user suspend/restore,
  persisted system settings, audit-log viewer; every other section scaffolded
  (route + nav + permission guard) with its phase noted
- **Public** — premium homepage, course catalogue, **certificate verification**
  (`/verify/CF-XXXXXX`)
- **Full database schema** — ~45 entities across every domain (`prisma/schema.prisma`)
- **Swappable abstractions** — AI (Anthropic / mock), payments (Paystack / mock,
  fully wired in Phase 6), email (SMTP / console), storage (S3 / local). The
  app runs end-to-end with zero external accounts.
- **Seed data** — env-driven admin, demo customer, CV templates, subscription
  plans, a demo course + exam

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · PostgreSQL · Prisma · Auth.js
(NextAuth v5) · Tailwind CSS · zod · Anthropic SDK · Paystack · @react-pdf/renderer

## Quick start

```bash
npm install
cp .env.example .env          # set DATABASE_URL and AUTH_SECRET (npx auth secret)
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev
```

Full instructions: [docs/SETUP.md](docs/SETUP.md).

## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | The 17-part architecture plan (system, stack, ERD, structure, auth, admin, customer, AI, payments, courses, exams, certificates, ads, API, security, deployment, roadmap) |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema overview and key-model notes |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phase-by-phase plan + per-module workflow |
| [docs/SECURITY.md](docs/SECURITY.md) | Security controls + production go-live checklist |
| [docs/SETUP.md](docs/SETUP.md) | Environment, scripts, first run |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step: GitHub → database → Vercel → Paystack webhook → go-live |

## Project layout

```
prisma/         schema + seed
docs/           architecture & guides
scripts/        preview.mjs — zero-setup local demo runner (embedded Postgres)
src/app/        (auth) (dashboard) (admin) courses verify api  + root
src/components/ ui primitives + layout shell + cv/ (editor & preview)
src/lib/        auth rbac db env api audit  + ai/ payments/ billing/ email/ storage/
                cv/ course/ exam/ certificate/ ads/ — domain services & schemas
src/components/ads/  server-rendered AdSlot
src/types/      shared types + next-auth augmentation
middleware.ts   edge route guard
```

## License

Proprietary — all rights reserved.
