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

describe("renderMarkdown playground blocks", () => {
  const md = "Intro\n\n```playground Make the title red\n<h1>Hello</h1>\n<style>h1{color:blue}</style>\n```\n\nOutro";

  it("emits a playground container carrying the code and a plain-code fallback", () => {
    const html = renderMarkdown(md);
    expect(html).toContain('class="cf-playground"');
    expect(html).toContain('data-title="Make the title red"');
    expect(html).toContain("data-code=");
    expect(html).toContain("<pre><code>&lt;h1&gt;Hello&lt;/h1&gt;");
  });

  it("never lets code or the title break out of the attributes", () => {
    const evil = '```playground x" onmouseover="alert(1)\n"><script>alert(2)</script><img src=x onerror=alert(3)>\n```';
    const html = renderMarkdown(evil);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    // The opening tag carries exactly the three attributes we wrote — the quotes in
    // the title are escaped, so "onmouseover=" is inert text, not a real attribute.
    const tag = html.match(/<div class="cf-playground"[^>]*>/)![0];
    const attrs = [...tag.matchAll(/\s([a-z-]+)="[^"]*"/g)].map((m) => m[1]);
    expect(attrs).toEqual(["class", "data-lang", "data-title", "data-code"]);
  });

  it("leaves ordinary code fences alone", () => {
    const html = renderMarkdown("```js\nconst a = 1;\n```");
    expect(html).toBe("<pre><code>const a = 1;</code></pre>");
  });
});
