import { describe, expect, it } from "vitest";
import { htmlToText, inferJobType, inferLocationType } from "@/lib/jobs/ingest/text";

describe("htmlToText", () => {
  it("strips tags and keeps list structure", () => {
    const t = htmlToText("<h2>Role</h2><p>Build things.</p><ul><li>SQL</li><li>Python</li></ul>");
    expect(t).toContain("Role");
    expect(t).toContain("• SQL");
    expect(t).not.toMatch(/<[a-z]/i);
  });

  it("decodes entity-escaped HTML (Greenhouse style)", () => {
    const t = htmlToText("&lt;p&gt;Who we are &amp;amp; what we do&lt;/p&gt;");
    expect(t).toBe("Who we are & what we do");
  });

  it("handles HTML that is escaped twice", () => {
    const t = htmlToText("&amp;lt;div class=&amp;quot;x&amp;quot;&amp;gt;&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;&amp;lt;/div&amp;gt;");
    expect(t).toBe("Hello");
  });

  it("drops script and style blocks", () => {
    expect(htmlToText("<p>Hi</p><script>alert(1)</script><style>p{}</style>")).toBe("Hi");
  });
});

describe("inference helpers", () => {
  it("reads job type from commitment text", () => {
    expect(inferJobType("Full-time")).toBe("FULL_TIME");
    expect(inferJobType("Summer Intern")).toBe("INTERNSHIP");
    expect(inferJobType("Part time")).toBe("PART_TIME");
    expect(inferJobType("Contractor")).toBe("CONTRACT");
  });

  it("reads location type", () => {
    expect(inferLocationType("Remote - EU")).toBe("REMOTE");
    expect(inferLocationType("London (hybrid)")).toBe("HYBRID");
    expect(inferLocationType("Lagos, Nigeria")).toBe("ONSITE");
    expect(inferLocationType("anything", true)).toBe("REMOTE");
  });
});
