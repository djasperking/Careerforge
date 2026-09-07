import { createHash } from "crypto";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";

/**
 * Bunny Stream integration — protected video hosting for digital products.
 * Activates automatically once the four BUNNY_STREAM_* env vars are present,
 * mirroring how Vercel Blob switches on. Until then, hosted video is hidden
 * from the instructor form and `bunnyEnabled()` is false.
 *
 * Uploads go browser -> Bunny directly (resumable TUS) using a short-lived
 * signature we mint server-side, so the API key never reaches the client and
 * the Vercel 4.5 MB function-body limit doesn't apply. Playback uses signed,
 * expiring embed URLs; lock the library to the careerforge.com.ng referrer in
 * the Bunny dashboard for domain protection.
 */

const API_BASE = "https://video.bunnycdn.com";
export const BUNNY_TUS_ENDPOINT = `${API_BASE}/tusupload`;

export function bunnyEnabled(): boolean {
  return Boolean(
    env.BUNNY_STREAM_LIBRARY_ID &&
      env.BUNNY_STREAM_API_KEY &&
      env.BUNNY_STREAM_CDN_HOSTNAME &&
      env.BUNNY_STREAM_TOKEN_KEY,
  );
}

function config() {
  if (!bunnyEnabled()) throw new ApiError(503, "VIDEO_NOT_CONFIGURED", "Hosted video is not configured.");
  return {
    libraryId: env.BUNNY_STREAM_LIBRARY_ID!,
    apiKey: env.BUNNY_STREAM_API_KEY!,
    cdnHostname: env.BUNNY_STREAM_CDN_HOSTNAME!.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    tokenKey: env.BUNNY_STREAM_TOKEN_KEY!,
  };
}

const sha256Hex = (input: string) => createHash("sha256").update(input).digest("hex");

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiKey } = config();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { AccessKey: apiKey, "Content-Type": "application/json", accept: "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new ApiError(502, "BUNNY_ERROR", `Bunny Stream request failed (${res.status}).`);
  }
  return (await res.json().catch(() => ({}))) as T;
}

/** Create an empty video and return its guid. */
export async function createBunnyVideo(title: string): Promise<string> {
  const { libraryId } = config();
  const data = await api<{ guid: string }>(`/library/${libraryId}/videos`, {
    method: "POST",
    body: JSON.stringify({ title: title.slice(0, 200) || "Untitled" }),
  });
  if (!data.guid) throw new ApiError(502, "BUNNY_ERROR", "Bunny Stream did not return a video id.");
  return data.guid;
}

/** Sign a browser TUS upload for a specific video guid (valid ~2h). */
export function signBunnyUpload(guid: string): {
  endpoint: string;
  libraryId: string;
  videoId: string;
  signature: string;
  expires: number;
} {
  const { libraryId, apiKey } = config();
  const expires = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const signature = sha256Hex(`${libraryId}${apiKey}${expires}${guid}`);
  return { endpoint: BUNNY_TUS_ENDPOINT, libraryId, videoId: guid, signature, expires };
}

export type BunnyVideo = { guid: string; status: number; length: number };

/** Poll a video's encoding state. Bunny status 4 = finished, 5/6 = error. */
export async function getBunnyVideo(guid: string): Promise<BunnyVideo> {
  const { libraryId } = config();
  const data = await api<{ guid: string; status: number; length: number }>(
    `/library/${libraryId}/videos/${encodeURIComponent(guid)}`,
  );
  return { guid: data.guid, status: data.status ?? 0, length: data.length ?? 0 };
}

export async function deleteBunnyVideo(guid: string): Promise<void> {
  const { libraryId } = config();
  await api(`/library/${libraryId}/videos/${encodeURIComponent(guid)}`, { method: "DELETE" }).catch(() => {});
}

/** A signed, expiring embed URL for the Bunny player iframe. */
export function bunnyEmbedUrl(guid: string, ttlSeconds = 3 * 60 * 60): string {
  const { libraryId, tokenKey } = config();
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const token = sha256Hex(`${tokenKey}${guid}${expires}`);
  const params = new URLSearchParams({ token, expires: String(expires) });
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}?${params.toString()}`;
}

/** Poster/thumbnail served straight from the pull zone (no token needed if referrer-locked). */
export function bunnyThumbnailUrl(guid: string): string {
  const { cdnHostname } = config();
  return `https://${cdnHostname}/${guid}/thumbnail.jpg`;
}

export function isVideoDelivery(deliveryType: string): boolean {
  return deliveryType === "EXTERNAL_VIDEO" || deliveryType === "HOSTED_VIDEO";
}
