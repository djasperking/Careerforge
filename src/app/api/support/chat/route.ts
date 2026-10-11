import { getCurrentUser } from "@/lib/session";
import { getAIProvider } from "@/lib/ai";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { buildSupportKnowledge } from "@/lib/support/knowledge";
import { cleanMessages, FALLBACK_REPLY } from "@/lib/support/chat";

export const maxDuration = 60;

/** How long the assistant gets before we hand the user to the ticket form. */
const AI_PATIENCE_MS = 25_000;

const CATEGORIES = ["PAYMENT", "COURSE", "ACCOUNT", "CV", "TECHNICAL", "OTHER"] as const;

/** Tells the widget whether the visitor is logged in (tickets need an account). */
export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ ok: true, loggedIn: Boolean(user) });
}

/** One turn of the support chat. Anonymous visitors can chat; it's rate-limited by IP. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const ip = clientIp(req.headers);
  try {
    rateLimit(`support-chat:${ip}`, { windowSeconds: 60, max: 12 });
    rateLimit(`support-chat-day:${user?.id ?? ip}`, { windowSeconds: 86_400, max: 150 });
  } catch {
    return Response.json({ ok: false, error: "You're sending messages very fast. Please wait a moment." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { messages?: unknown } | null;
  const messages = cleanMessages(body?.messages);
  if (!messages) {
    return Response.json({ ok: false, error: "Type a message first." }, { status: 422 });
  }

  const ctx = { feature: "support.chat", userId: user?.id };
  try {
    const knowledge = await buildSupportKnowledge();
    const provider = getAIProvider();
    const answer = provider
      .supportChat({ messages, knowledge, loggedIn: Boolean(user) }, ctx)
      .then((r) => r.data)
      .catch((err) => {
        console.error("support chat: AI failed", err);
        return null;
      });
    const waited = new Promise<null>((resolve) => setTimeout(() => resolve(null), AI_PATIENCE_MS));
    const data = await Promise.race([answer, waited]);

    if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
      return Response.json({ ok: true, reply: FALLBACK_REPLY, suggestTicket: true, category: "OTHER", loggedIn: Boolean(user) });
    }
    const category = (CATEGORIES as readonly string[]).includes(data.category) ? data.category : "OTHER";
    return Response.json({
      ok: true,
      reply: data.reply.trim().slice(0, 1500),
      suggestTicket: Boolean(data.suggestTicket),
      category,
      loggedIn: Boolean(user),
    });
  } catch (err) {
    console.error("support chat failed", err);
    return Response.json({ ok: true, reply: FALLBACK_REPLY, suggestTicket: true, category: "OTHER", loggedIn: Boolean(user) });
  }
}
