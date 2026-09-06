import { NextRequest } from "next/server";
import { handler, ok, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { ALLOWED_UPLOADS, assertUploadAllowed, getStorage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Authenticated file upload. Any signed-in user may upload the allowed kinds
 * (course thumbnails, product files, etc.); the calling form is responsible
 * for attaching the returned URL to a record the user is allowed to edit.
 */
export const POST = handler(async (req: NextRequest) => {
  const user = await requireUserApi();
  rateLimit(`upload:${user.id}`, { windowSeconds: 60, max: 20 });
  rateLimit(`upload-ip:${clientIp(req.headers)}`, { windowSeconds: 60, max: 40 });

  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");

  if (!(file instanceof File)) throw new ApiError(400, "NO_FILE", "No file was uploaded.");
  if (!(kind in ALLOWED_UPLOADS)) throw new ApiError(400, "BAD_KIND", "Unknown upload kind.");

  const bytes = Buffer.from(await file.arrayBuffer());
  assertUploadAllowed(kind as keyof typeof ALLOWED_UPLOADS, file.type, bytes.length);

  const stored = await getStorage().put(kind, file.name || "upload", bytes, file.type);
  return ok({ url: stored.url, key: stored.key, size: stored.size, mime: stored.mime });
});
