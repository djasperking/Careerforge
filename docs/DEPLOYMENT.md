# Career Forge — Deployment

This is the concrete path from "code on my machine" to "live on the internet."
Nothing in the app needs to change for this — it was built env-driven from
Phase 1 (see [ARCHITECTURE.md §16](./ARCHITECTURE.md#16-deployment-architecture)).
Read [SECURITY.md](./SECURITY.md)'s go-live checklist alongside this before
flipping it on for real users.

## 0. What you'll need

- A **GitHub** account (to host the repo Vercel deploys from)
- A **Vercel** account (free tier is fine to start)
- A managed **Postgres** database — [Neon](https://neon.tech) or
  [Supabase](https://supabase.com) both have a free tier and work well with
  Vercel's serverless functions (connection pooling built in)
- A **Paystack** account with API keys (test keys to start, live keys before
  real money moves)
- An **Anthropic** API key (skip this and the app runs on the mock AI provider —
  fully functional, just not real AI)
- Optional but recommended before real users: an S3-compatible bucket
  (Cloudflare R2 or AWS S3), an SMTP/email provider (Resend, Postmark, SES),
  and a [Sentry](https://sentry.io) project

## 1. Push the code to GitHub

```bash
git init
git add .
git status                      # sanity-check nothing in .env made it in
git commit -m "Initial commit: Career Forge Phases 1-10"
git branch -M main
git remote add origin https://github.com/<you>/career-forge.git
git push -u origin main
```

`.env` is already gitignored — double-check `git status` shows nothing
containing real secrets before you push.

## 2. Create the production database

Neon or Supabase, either works the same way here:

1. Create a new Postgres project.
2. Copy its connection string (Neon: use the **pooled** connection string;
   Supabase: use the "Transaction" pooler string on port 6543). This becomes
   `DATABASE_URL`.
3. Apply the schema:

   ```bash
   DATABASE_URL="<your production connection string>" npm run db:migrate:deploy
   ```

   This runs the migration in `prisma/migrations/` — it only ever applies
   forward, never resets data, and is safe to re-run.
4. Optionally seed a real admin account (edit `prisma/seed.ts` first if you
   don't want the demo course/customer data in production, or just run it and
   delete the demo rows afterward):

   ```bash
   DATABASE_URL="<your production connection string>" \
   ADMIN_EMAIL="you@yourcompany.com" ADMIN_PASSWORD="<a strong password>" \
   npm run db:seed
   ```

## 3. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo. Vercel
   auto-detects Next.js — no build command changes needed
   (`prisma generate && next build` is already the `build` script).
2. Before the first deploy, add every environment variable from
   `.env.example` in **Project Settings → Environment Variables**, with real
   values:

   | Variable | Production value |
   |---|---|
   | `DATABASE_URL` | your Neon/Supabase connection string |
   | `AUTH_SECRET` | generate fresh: `npx auth secret` (never reuse the local dev one) |
   | `NEXT_PUBLIC_APP_URL` | your real domain, e.g. `https://careerforge.com` |
   | `PAYMENT_PROVIDER` | `paystack` |
   | `PAYSTACK_SECRET_KEY` / `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | from the Paystack dashboard (start with **test** keys) |
   | `PAYSTACK_WEBHOOK_SECRET` | see step 4 below |
   | `AI_PROVIDER` | `anthropic` (or leave as `mock` if you don't have a key yet) |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com |
   | `EMAIL_PROVIDER` | `smtp` once you have a provider; `console` just logs emails to Vercel's function logs |
   | `SMTP_*` | from your email provider |
   | `STORAGE_PROVIDER` | `s3` once you've implemented the R2/S3 branch in `src/lib/storage` (currently `local`, which does **not** work on Vercel's read-only filesystem — see the note below) |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | only needed if you run the seed against production |

   Do **not** set `NODE_ENV` — Vercel sets it automatically.
3. Deploy. Vercel gives you a `*.vercel.app` URL immediately; add your real
   domain under **Project Settings → Domains** and point its DNS at Vercel
   (it issues the TLS certificate automatically).

> **Storage note:** `STORAGE_PROVIDER=local` writes to `public/uploads`, which
> does not persist on Vercel (serverless functions have a read-only/ephemeral
> filesystem). Before anyone uploads a profile photo, course thumbnail or
> video in production, implement the S3 branch in
> [`src/lib/storage/index.ts`](../src/lib/storage/index.ts) — the interface is
> already there (`put`/`delete`), only the S3 client call is missing.

## 4. Wire up the Paystack webhook

1. In the Paystack dashboard → Settings → API Keys & Webhooks, set the
   webhook URL to `https://yourdomain.com/api/webhooks/paystack`.
2. Paystack shows a webhook secret (or reuses your secret key, depending on
   your Paystack account type) — set that as `PAYSTACK_WEBHOOK_SECRET` in
   Vercel and redeploy.
3. Send a test webhook from the Paystack dashboard and confirm it shows up in
   **Admin → Payments → Webhook events** as "Processed".

## 5. Post-deploy smoke test

Walk the two journeys the spec calls out explicitly:

1. Register → verify email (check it arrives) → log in → build a CV → buy a
   course with a real Paystack test card → confirm the enrollment unlocks →
   complete lessons → pass the exam → certificate appears and verifies
   publicly at `/verify/CF-XXXXXX`.
2. Log in as admin → create and publish a course → confirm a customer can
   find and buy it → refund it → confirm the enrollment reverts.

## 6. Before real money moves

Work through [SECURITY.md](./SECURITY.md)'s full checklist. The short version
of what's still open after this session's Phase 10 pass:

- Swap `PAYSTACK_SECRET_KEY`/`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` from test to
  **live** keys only when you're ready to accept real payments
- Move the in-memory rate limiter (`src/lib/rate-limit.ts`) to Upstash Redis —
  as deployed, limits reset on every cold start and don't share state across
  serverless instances
- Implement the S3/R2 branch in `src/lib/storage` (see the note in step 3)
- Wire up Sentry (or similar) for error tracking; point something at
  `/api/health` for uptime monitoring
- Set up automated database backups (Neon/Supabase both offer this — turn it
  on, don't assume it's on by default on the free tier) and actually test a
  restore once
- Add CI (GitHub Actions is enough): run `npm run typecheck`, `npm run lint`,
  `npm test`, and `npm run build` on every PR before it can merge

## Redeploying after schema changes

Whenever `prisma/schema.prisma` changes:

```bash
npm run db:migrate          # locally: creates a new migration file + applies it to your dev DB
git add prisma/migrations
git commit -m "..."
git push                    # Vercel deploys the new code
npm run db:migrate:deploy   # with production DATABASE_URL — applies the new migration
```

Deploy the migration **before or alongside** the code that depends on it —
never after, or the new code will hit a database that doesn't have the columns
it expects yet.
