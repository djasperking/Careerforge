import { describe, it, expect } from "vitest";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("escapes HTML", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).not.toContain("<script>");
    expect(renderMarkdown("<script>alert(1)</script>")).toContain("&lt;script&gt;");
  });
  it("renders headings, bold, links and lists", () => {
    const h = renderMarkdown("## Title\n\nsome **bold** and [a link](https://example.com)\n\n- one\n- two");
    expect(h).toContain("<h3>Title</h3>");
    expect(h).toContain("<strong>bold</strong>");
    expect(h).toContain('<a href="https://example.com"');
    expect(h).toContain("<ul>");
    expect(h).toContain("<li>one</li>");
  });
  it("only allows http(s) links", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toContain("<a ");
  });
});
