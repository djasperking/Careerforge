import { NextRequest } from "next/server";
import { handler, ok, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { requireApprovedInstructor } from "@/lib/instructor/service";
import { rateLimit } from "@/lib/rate-limit";
import { bunnyEnabled, createBunnyVideo, signBunnyUpload } from "@/lib/video/bunny";

export const runtime = "nodejs";

/**
 * Create a Bunny Stream video and hand the browser a signed TUS upload ticket.
 * The file is then uploaded browser -> Bunny directly (see HostedVideoField).
 */
export const POST = handler(async (req: NextRequest) => {
  const user = await requireUserApi();
  await requireApprovedInstructor(user.id);
  if (!bunnyEnabled()) throw new ApiError(503, "VIDEO_NOT_CONFIGURED", "Hosted video is not available yet.");
  rateLimit(`bunny-create:${user.id}`, { windowSeconds: 60, max: 10 });

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const guid = await createBunnyVideo(body.title?.trim() || "Career Forge product video");
  return ok({ guid, upload: signBunnyUpload(guid) });
});
