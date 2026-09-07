import { getCurrentUser } from "@/lib/session";
import { messagesSince } from "@/lib/messaging/service";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const since = new URL(req.url).searchParams.get("since") ?? new Date(0).toISOString();
  try {
    const messages = await messagesSince(user.id, id, since);
    return Response.json({ messages });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
