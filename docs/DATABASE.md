# Career Forge — Database

Source of truth: [`prisma/schema.prisma`](../prisma/schema.prisma).
PostgreSQL. Money is stored as integer minor units (`amountCents`) + ISO
currency code. Every foreign key is indexed; status/date columns used for
filtering are indexed.

## Setup

```bash
cp .env.example .env          # set DATABASE_URL, AUTH_SECRET, ADMIN_* etc.
npm run db:generate           # prisma generate
npm run db:migrate            # create + apply the first migration (dev)
npm run db:seed               # demo/development data
npm run db:studio             # browse data
```

For a throwaway database without migration history: `npm run db:push`.

## Domain groups

| Group | Tables |
|---|---|
| Auth & RBAC | `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `AuthSession`, `VerificationToken` |
| Profile | `Profile`, `Education`, `Experience`, `ProfileCertification`, `Project` |
| CV | `CVTemplate`, `CV`, `CVVersion`, `CVAnalysis` |
| LMS | `Category`, `Course`, `CourseModule`, `Lesson`, `LessonResource`, `LessonNote`, `LessonBookmark`, `Enrollment`, `CourseProgress`, `Review` |
| Assessment | `Quiz`, `Exam`, `Question`, `QuestionOption`, `ExamAttempt`, `ExamAnswer`, `ExamSecurityEvent` |
| Certificates | `Certificate` |
| Billing | `Transaction`, `PaymentWebhookEvent`, `SubscriptionPlan`, `Subscription` |
| AI | `AIPrompt`, `AIRequest`, `AIUsage` |
| Advertising | `AdCampaign`, `Advertisement`, `AdImpression`, `AdClick` |
| Comms | `Notification`, `EmailLog` |
| Support | `SupportTicket`, `TicketMessage` |
| CMS | `ContentBlock`, `BlogPost` |
| Platform | `AuditLog`, `SystemSetting` |

## Notes on key models

- **User / RBAC** — a user has many roles (`UserRole`); a role has many
  permissions (`RolePermission`). Code checks permission keys, not role names,
  so admins can re-map freely. `User.status` gates authentication.
- **VerificationToken** — one row per email-verification / password-reset /
  email-change request. Only `tokenHash` (SHA-256) is stored.
- **CV** — `content` is a structured JSON document; each save appends a
  `CVVersion`. `CVAnalysis` stores one CV-vs-job-description analysis.
- **Course → Module → Lesson** — ordered by `position` (unique per parent).
  `CourseProgress` is written server-side; completion is recomputed, never
  client-set.
- **Exam / ExamAttempt** — `serverDeadline` and `sessionId` make timing
  server-authoritative; `(examId, userId, attemptNumber)` is unique.
  `ExamSecurityEvent` is the anti-cheating audit trail.
- **Transaction / PaymentWebhookEvent** — `reference` is our idempotency key;
  `(provider, eventId)` on webhook events guarantees idempotent processing.
- **SubscriptionPlan.limits** — JSON; all plan rules (AI quotas, CV counts,
  premium access) live here as data.
- **AuditLog / SystemSetting** — cross-cutting; every sensitive action is
  audited, and global config is stored, not hard-coded.
