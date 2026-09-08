import { z } from "zod";

/**
 * Central, validated environment access. Import from here instead of reading
 * process.env directly so a missing/invalid value fails fast at boot.
 * Only NEXT_PUBLIC_* values are safe to reference in client components.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Career Forge"),
  // Google Search Console HTML-tag verification token (the `content` value).
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),

  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 chars"),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  DEMO_CUSTOMER_EMAIL: z.string().email().optional(),
  DEMO_CUSTOMER_PASSWORD: z.string().min(8).optional(),

  AI_PROVIDER: z.enum(["anthropic", "google", "mock"]).default("mock"),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
  AI_MODEL: z.string().default("claude-sonnet-5"),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(2000),

  PAYMENT_PROVIDER: z.enum(["paystack", "mock"]).default("mock"),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  DEFAULT_CURRENCY: z.string().default("NGN"),

  EMAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  EMAIL_FROM: z.string().default("Career Forge <no-reply@careerforge.local>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  STORAGE_PROVIDER: z.enum(["local", "s3", "vercel-blob"]).default("local"),
  STORAGE_PUBLIC_BASE_URL: z.string().default("http://localhost:3000/uploads"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Bunny Stream — protected video hosting for digital products (Phase 2).
  BUNNY_STREAM_LIBRARY_ID: z.string().optional(),
  BUNNY_STREAM_API_KEY: z.string().optional(),
  BUNNY_STREAM_CDN_HOSTNAME: z.string().optional(), // e.g. vz-xxxxxxxx.b-cdn.net
  BUNNY_STREAM_TOKEN_KEY: z.string().optional(), // library "Token Authentication Key" for signed playback

  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),

  // Shared secret for scheduled jobs (Vercel Cron sends it as a bearer token).
  CRON_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see .env.example");
}

export const env = parsed.data;
