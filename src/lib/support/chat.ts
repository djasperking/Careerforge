/** Pure helpers for the support chat (safe to import anywhere). */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const MAX_MESSAGES = 12;
export const MAX_CHARS = 800;

export const FALLBACK_REPLY =
  "I'm having trouble answering right now. Please create a support ticket and a member of the team will help you.";

/**
 * Validate and trim a chat transcript from the browser. Returns null when it
 * isn't usable (wrong shape, empty, or the last message isn't from the user).
 */
export function cleanMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
    if (text) out.push({ role, content: text });
  }
  if (out.length === 0 || out[out.length - 1].role !== "user") return null;
  // The model should start from a user turn.
  while (out.length && out[0].role !== "user") out.shift();
  return out.length ? out : null;
}

/** A sensible ticket subject from what the user first asked. */
export function deriveTicketSubject(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user")?.content ?? "";
  const clean = first.replace(/\s+/g, " ").trim();
  if (!clean) return "Help from the support chat";
  return clean.length > 80 ? clean.slice(0, 77).trimEnd() + "…" : clean;
}

/** The user's side of the conversation, as the starting text of a ticket. */
export function deriveTicketMessage(messages: ChatMessage[]): string {
  const userLines = messages.filter((m) => m.role === "user").map((m) => m.content);
  return userLines.join("\n\n").slice(0, 1500);
}
