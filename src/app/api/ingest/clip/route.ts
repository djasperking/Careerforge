import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { ingestClip } from "@/lib/jobs/ingest/clip";

export const maxDuration = 60;

const bodySchema = z.object({
  url: z.string().url().max(2000),
  title: z.string().max(400).optional(),
  text: z.string().max(80_000).optional(),
  jsonLd: z.array(z.unknown()).max(10).optional(),
  via: z.string().max(60).optional(),
});

function tokenOk(header: string | null): boolean {
  const expected = env.JOB_CLIPPER_TOKEN;
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const a = Buffer.from(header.slice(7));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Receives a job page clipped by the owner's browser extension and files it as
 * a DRAFT for review. Token-protected; disabled (503) until JOB_CLIPPER_TOKEN
 * is configured.
 */
export async function POST(req: Request) {
  if (!env.JOB_CLIPPER_TOKEN) {
    return Response.json({ ok: false, error: "Job clipper is not configured." }, { status: 503 });
  }
  if (!tokenOk(req.headers.get("authorization"))) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  try {
    rateLimit("job-clip", { windowSeconds: 60, max: 60 });
  } catch {
    return Response.json({ ok: false, error: "Slow down — too many clips." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "That page couldn't be read." }, { status: 422 });
  }
  const d = parsed.data;
  if (!d.jsonLd?.length && (d.text ?? "").trim().length < 80) {
    return Response.json({ ok: false, error: "Not enough text on that page to read a job from." }, { status: 422 });
  }

  try {
    const result = await ingestClip(d);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("job clip failed", err);
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Clip failed." }, { status: 422 });
  }
}
