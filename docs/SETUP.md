# Career Forge — Setup & Development

## Prerequisites

- Node.js 20+ (22 recommended)
- PostgreSQL 15+ running locally or a hosted URL
- (optional) Anthropic API key, Paystack **test** keys

## First run

```bash
npm install

cp .env.example .env
#  Required to boot:
#   DATABASE_URL   — your Postgres connection string
#   AUTH_SECRET    — run: npx auth secret   (or: openssl rand -base64 32)
#  Recommended for the seed:
#   ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_CUSTOMER_EMAIL, DEMO_CUSTOMER_PASSWORD

npm run db:generate
npm run db:migrate      # first migration
npm run db:seed         # demo data + your admin user

npm run dev             # http://localhost:3000
```

Defaults with nothing else configured:
`AI_PROVIDER=mock`, `PAYMENT_PROVIDER=mock`, `EMAIL_PROVIDER=console`,
`STORAGE_PROVIDER=local`. The whole app runs with no external accounts —
verification / reset links and emails are printed to the dev server console.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create & apply a dev migration |
| `npm run db:push` | Push schema without migration history |
| `npm run db:seed` | Seed demo/development data |
| `npm run db:studio` | Prisma Studio |
| `npm test` | Vitest |

## Logging in

- **Admin:** the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set, at `/login`
  (seeded as Super Admin, email pre-verified). Lands on `/admin`.
- **Customer:** `DEMO_CUSTOMER_EMAIL` / `DEMO_CUSTOMER_PASSWORD`. Lands on
  `/dashboard`.
- **New sign-up:** `/register` → check the dev console for the verification
  link → `/verify-email?token=…` → log in.

## Environment variables

See [`.env.example`](../.env.example) for the annotated list. Only `NEXT_PUBLIC_*`
variables are exposed to the browser — never put a secret behind that prefix.

## Deployment

See [ARCHITECTURE.md §16](./ARCHITECTURE.md#16-deployment-architecture) and the
production checklist in [SECURITY.md](./SECURITY.md).
