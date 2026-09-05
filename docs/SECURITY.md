# Career Forge — Security

## Principles

**Never trust the browser.** The server/database is authoritative for:
payment status, exam timing, exam score, course completion, user permissions,
subscription status, certificate eligibility, AI usage limits.

Every feature: `Frontend → API → Authentication → Authorization → Business logic
→ DB/External → Response → UI`.

## Controls in place (Phase 1)

| Area | Control | Where |
|---|---|---|
| Passwords | bcrypt cost 12; never stored/logged in plain text; baseline policy | `src/lib/password.ts` |
| Tokens | email-verify / reset tokens are random, SHA-256-hashed at rest, single-use, expiring | `src/lib/tokens.ts` |
| Sessions | JWT, 7-day expiry, status re-checked; sessions purged on suspend/reset | `src/lib/auth.ts` |
| AuthZ | RBAC with fine-grained, configurable permission keys | `src/lib/rbac.ts` |
| Guards | edge middleware → page/layout guards → per-action re-check | `middleware.ts`, `src/lib/session.ts` |
| Input | zod schemas on every API body and server action | `src/lib/validation.ts`, per route |
| Output | React auto-escaping; JSON envelope; no stack traces to clients | `src/lib/api.ts` |
| SQL injection | Prisma parameterised queries; no string-built SQL with user input | — |
| Rate limiting | per-IP fixed window on auth endpoints (swap for Redis in prod) | `src/lib/rate-limit.ts` |
| Enumeration | register / forgot-password return identical responses regardless of account existence | auth routes |
| Headers | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` (Phase 10) | `next.config.mjs` |
| Uploads | MIME + extension + size + permission validation before storage | `src/lib/storage/index.ts` |
| Payments | webhook HMAC verification (constant-time) + `(provider,eventId)` idempotency; server-side `verify()` before activation; amounts always server-computed from the product record, never client input; checkout initiation rate-limited (Phase 6) | `src/lib/billing/service.ts`, `src/lib/payments/paystack.ts` |
| AI | keys server-only; per-plan limits enforced server-side; requests + usage logged; anti-fabrication system prompt | `src/lib/ai/*` |
| Audit | every sensitive mutation writes `AuditLog` (actor, action, entity, ip, metadata) | `src/lib/audit.ts` |
| Exam integrity | server-authoritative timer & scoring; `ExamSecurityEvent` log; single active session | Phase 4 design in `ARCHITECTURE.md §11` |
| Secrets | validated env; only `NEXT_PUBLIC_*` reaches the client | `src/lib/env.ts` |
| Privacy | decline non-essential cookies by default; no PII in URLs/query strings | design rule |

## Honest limits

Browser-side exam restrictions (disable copy/paste, detect tab switch, etc.) are
**deterrents and an audit trail**, not a guarantee against a determined cheater.
All exam rules are enforced server-side; admins review flagged attempts. We do
not claim any exam is impossible to cheat.

## Production go-live checklist

- [ ] `AUTH_SECRET` is a fresh 32+ byte random value, unique per environment
- [ ] Postgres over TLS; least-privilege DB user; connection pooling
- [ ] `PAYMENT_PROVIDER=paystack` with **live** keys (not the local `mock`
      default); `PAYSTACK_WEBHOOK_SECRET` set; webhook endpoint reachable and
      signature-checked
- [ ] `ANTHROPIC_API_KEY` set; per-plan AI limits configured in plan `limits`
- [ ] Rate limiter backed by Redis (not in-memory) — currently in-process, so
      it resets on deploy and doesn't share state across instances
- [ ] Object storage on S3/R2 with private buckets + signed URLs; not local disk
- [ ] SMTP/email provider configured; SPF/DKIM/DMARC on the sending domain
- [x] Security headers reviewed; CSP added (Phase 10) — replace
      `'unsafe-inline'`/`'unsafe-eval'` in `script-src` with a per-request
      nonce before launch; HTTPS enforced; HSTS still to add at the edge/CDN
- [ ] Error tracking (Sentry) + uptime + DB alerts wired — `/api/health` exists
      but nothing polls it yet
- [ ] Automated daily backups + a tested restore procedure
- [x] `npm run typecheck`, lint and unit test suite green — wire into CI;
      integration/e2e suites still to be written
- [ ] Admin accounts use strong unique passwords; 2FA enabled (Phase 9+)
- [~] Dependency audit — bumped `next` and `next-auth` to current patches
      (Phase 10), cutting `npm audit` from 13 to 10 findings; the rest need a
      `next` v16 or `vitest` v5 major bump, deliberately not done yet. Keep
      Dependabot/renovate on and revisit before launch
- [ ] Private dashboards excluded from indexing; `robots.txt` + sitemap correct
- [ ] Load test the critical journeys; verify pagination everywhere (no
      unbounded list endpoints)
