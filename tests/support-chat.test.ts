import { describe, expect, it } from "vitest";
import { cleanMessages, deriveTicketMessage, deriveTicketSubject, MAX_CHARS, MAX_MESSAGES } from "@/lib/support/chat";

describe("cleanMessages", () => {
  it("accepts a normal transcript ending with a user message", () => {
    const out = cleanMessages([
      { role: "user", content: "How do refunds work?" },
      { role: "assistant", content: "Courses: 7 days." },
      { role: "user", content: "And for a CV unlock?" },
    ]);
    expect(out).toHaveLength(3);
    expect(out?.[2]).toEqual({ role: "user", content: "And for a CV unlock?" });
  });

  it.each([
    ["not an array", "hello"],
    ["empty", []],
    ["bad role", [{ role: "system", content: "x" }]],
    ["non-string content", [{ role: "user", content: 5 }]],
    ["ends with assistant", [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }]],
    ["only blank text", [{ role: "user", content: "   " }]],
  ])("rejects: %s", (_name, input) => {
    expect(cleanMessages(input)).toBeNull();
  });

  it("trims long messages and collapses whitespace", () => {
    const out = cleanMessages([{ role: "user", content: "a   b\n\n c " + "x".repeat(2000) }]);
    expect(out?.[0].content.length).toBeLessThanOrEqual(MAX_CHARS);
    expect(out?.[0].content.startsWith("a b c")).toBe(true);
  });

  it("keeps only the most recent messages and starts on a user turn", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `m${i}` }));
    many.push({ role: "user", content: "last" });
    const out = cleanMessages(many)!;
    expect(out.length).toBeLessThanOrEqual(MAX_MESSAGES);
    expect(out[0].role).toBe("user");
    expect(out[out.length - 1].content).toBe("last");
  });
});

describe("ticket drafting", () => {
  const msgs = [
    { role: "user" as const, content: "I paid for the Data Annotation course but it still shows locked" },
    { role: "assistant" as const, content: "Sorry about that. Please create a ticket." },
    { role: "user" as const, content: "Payment reference is course_ab12" },
  ];
  it("uses the first question as the subject, shortened", () => {
    expect(deriveTicketSubject(msgs)).toBe("I paid for the Data Annotation course but it still shows locked");
    expect(deriveTicketSubject([{ role: "user", content: "x".repeat(200) }]).length).toBeLessThanOrEqual(80);
    expect(deriveTicketSubject([])).toBe("Help from the support chat");
  });
  it("starts the ticket with the user's own words only", () => {
    const body = deriveTicketMessage(msgs);
    expect(body).toContain("still shows locked");
    expect(body).toContain("course_ab12");
    expect(body).not.toContain("Sorry about that");
  });
});
