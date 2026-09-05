import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";

/**
 * File storage abstraction. `local` writes under /public/uploads for
 * development; `s3` should be implemented with an S3-compatible client
 * (AWS S3 / Cloudflare R2 / Cloudinary / Firebase) behind the same interface.
 */
export const ALLOWED_UPLOADS: Record<string, { mime: string[]; maxBytes: number }> = {
  "profile-image": { mime: ["image/png", "image/jpeg", "image/webp"], maxBytes: 3 * 1024 * 1024 },
  "course-thumbnail": { mime: ["image/png", "image/jpeg", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  "course-video": { mime: ["video/mp4", "video/webm"], maxBytes: 500 * 1024 * 1024 },
  "lesson-pdf": { mime: ["application/pdf"], maxBytes: 25 * 1024 * 1024 },
  "lesson-resource": { mime: ["application/pdf", "application/zip", "image/png", "image/jpeg"], maxBytes: 50 * 1024 * 1024 },
  "ad-image": { mime: ["image/png", "image/jpeg", "image/webp"], maxBytes: 3 * 1024 * 1024 },
  "cv-asset": { mime: ["image/png", "image/jpeg"], maxBytes: 2 * 1024 * 1024 },
};

export function assertUploadAllowed(kind: keyof typeof ALLOWED_UPLOADS, mime: string, size: number) {
  const rule = ALLOWED_UPLOADS[kind];
  if (!rule) throw new ApiError(400, "BAD_UPLOAD_KIND", `Unknown upload kind: ${kind}`);
  if (!rule.mime.includes(mime)) {
    throw new ApiError(415, "UNSUPPORTED_TYPE", `${mime} is not allowed for ${kind}`);
  }
  if (size > rule.maxBytes) {
    throw new ApiError(413, "FILE_TOO_LARGE", `Max ${Math.round(rule.maxBytes / 1024 / 1024)}MB for ${kind}`);
  }
}

export interface StoredFile {
  key: string;
  url: string;
  size: number;
  mime: string;
}

export interface StorageProvider {
  put(kind: string, filename: string, data: Buffer, mime: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

const localProvider: StorageProvider = {
  async put(kind, filename, data, mime) {
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads", kind);
    await mkdir(dir, { recursive: true });
    const safe = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await writeFile(path.join(dir, safe), data);
    const key = `${kind}/${safe}`;
    return { key, url: `${env.STORAGE_PUBLIC_BASE_URL}/${key}`, size: data.length, mime };
  },
  async delete(key) {
    const { unlink } = await import("fs/promises");
    const path = await import("path");
    await unlink(path.join(process.cwd(), "public", "uploads", key)).catch(() => {});
  },
};

export function getStorage(): StorageProvider {
  // TODO: return an S3 implementation when STORAGE_PROVIDER === "s3".
  return localProvider;
}
