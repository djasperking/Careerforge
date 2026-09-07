import { handler, ok, ApiError } from "@/lib/api";
import { requireUserApi } from "@/lib/session";
import { requireApprovedInstructor } from "@/lib/instructor/service";
import { bunnyEnabled, getBunnyVideo } from "@/lib/video/bunny";

export const runtime = "nodejs";

/** Poll a Bunny video's encoding state while the instructor form waits. */
export const GET = handler(async (req: Request, ctx: { params: Promise<{ guid: string }> }) => {
  void req;
  const user = await requireUserApi();
  await requireApprovedInstructor(user.id);
  if (!bunnyEnabled()) throw new ApiError(503, "VIDEO_NOT_CONFIGURED", "Hosted video is not available yet.");

  const { guid } = await ctx.params;
  const video = await getBunnyVideo(guid);
  return ok({
    status: video.status,
    ready: video.status === 3 || video.status === 4,
    failed: video.status === 5 || video.status === 6,
    durationSec: Math.round(video.length) || null,
  });
});
