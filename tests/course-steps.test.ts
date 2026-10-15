import { describe, expect, it } from "vitest";
import { splitSteps } from "@/lib/course/steps";
import { renderMarkdown } from "@/lib/markdown";

const LESSON = `## 🏗️ Your first page

Intro text.

### Tags

Body about tags.

::: check Which tag closes a paragraph?
- <p>
+ </p>
- <end>
= Closing tags start with a slash.
:::

> 📌 **Remember:** closing tags have a slash.

### Playing

\`\`\`playground Try it
<h1>Hi</h1>
\`\`\`

\`\`\`
### not a heading, inside a fence
\`\`\`
`;

describe("splitSteps", () => {
  it("makes one step per ### heading, with the ## title opening the lesson", () => {
    const steps = splitSteps(LESSON);
    expect(steps.map((s) => s.title)).toEqual(["🏗️ Your first page", "Tags", "Playing"]);
    expect(steps[0].body).toBe("Intro text.");
  });

  it("pulls questions out of the body and parses them", () => {
    const [, tags] = splitSteps(LESSON);
    expect(tags.body).not.toContain(":::");
    expect(tags.checks).toHaveLength(1);
    expect(tags.checks[0].options.map((o) => o.correct)).toEqual([false, true, false]);
    expect(tags.checks[0].explain).toMatch(/slash/);
  });

  it("collects key points and detects playgrounds", () => {
    const steps = splitSteps(LESSON);
    expect(steps[1].keyPoints).toEqual(["**Remember:** closing tags have a slash."]);
    expect(steps[2].hasPlayground).toBe(true);
    expect(steps[2].body).toContain("### not a heading");
  });

  it("drops malformed questions instead of showing a broken one", () => {
    const steps = splitSteps("### A\n\n::: check Q?\n+ one\n+ two\n:::\n");
    expect(steps[0].checks).toEqual([]);
  });

  it("handles empty input", () => {
    expect(splitSteps("")).toEqual([]);
    expect(splitSteps(null)).toEqual([]);
  });
});

describe("renderMarkdown emphasis", () => {
  it("renders bold with code inside, bold-italic and callouts", () => {
    expect(renderMarkdown("**one `<h1>` per page**")).toContain("<strong>one <code>&lt;h1&gt;</code> per page</strong>");
    expect(renderMarkdown("***big***")).toContain("<strong><em>big</em></strong>");
    expect(renderMarkdown("> 💡 tip")).toContain('class="cf-callout cf-tip"');
  });
  it("leaves asterisks inside code alone", () => {
    expect(renderMarkdown("use `* { }` here")).toContain("<code>* { }</code>");
  });
});

describe("seeded course lessons", () => {
  it("every question written in the HTML & CSS lessons parses (none silently dropped)", async () => {
    const fs = await import("node:fs");
    const dir = "scripts/course-content/html-css/";
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".md"))) {
      const md = fs.readFileSync(dir + f, "utf8");
      const written = (md.match(/^::: check /gm) ?? []).length;
      const parsed = splitSteps(md).reduce((n, s) => n + s.checks.length, 0);
      expect(parsed, f).toBe(written);
    }
  });
});
