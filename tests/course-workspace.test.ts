import { describe, expect, it } from "vitest";
import {
  composePreview,
  mergeWithStarter,
  parseSubmission,
  parseWorkspaceBrief,
  serializeSubmission,
} from "@/lib/course/workspace";
import { checkWebsite, summarize } from "@/lib/course/site-check";

const BRIEF = `## Build it

[[workspace checks=html,css]]

Some instructions.

\`\`\`file:index.html
<h1>Hello</h1>
\`\`\`

More text.

\`\`\`file:style.css
h1 { color: red; }
\`\`\`

\`\`\`js
console.log("a normal code block stays in the brief");
\`\`\`
`;

describe("parseWorkspaceBrief", () => {
  it("is off when the brief has no marker, and leaves the brief alone", () => {
    const r = parseWorkspaceBrief("## Just text\n\n```js\nx\n```");
    expect(r.enabled).toBe(false);
    expect(r.files).toEqual([]);
    expect(r.brief).toContain("```js");
  });

  it("reads checks and starter files, and strips the setup from the brief", () => {
    const r = parseWorkspaceBrief(BRIEF);
    expect(r.enabled).toBe(true);
    expect(r.checks).toEqual(["html", "css"]);
    expect(r.files.map((f) => f.name)).toEqual(["index.html", "style.css"]);
    expect(r.files[0].code).toBe("<h1>Hello</h1>");
    expect(r.brief).not.toContain("[[workspace");
    expect(r.brief).not.toContain("file:index.html");
    expect(r.brief).toContain("Some instructions.");
    expect(r.brief).toContain('console.log("a normal code block stays in the brief")');
  });

  it("falls back to an empty index.html and ignores unknown check groups", () => {
    const r = parseWorkspaceBrief("[[workspace checks=html,banana]]\nHi");
    expect(r.files).toEqual([{ name: "index.html", code: "" }]);
    expect(r.checks).toEqual(["html"]);
  });

  it("treats a bare marker as workspace with no checks", () => {
    expect(parseWorkspaceBrief("[[workspace]]").checks).toEqual([]);
  });
});

describe("composePreview", () => {
  const html = '<!DOCTYPE html><html><head><title>t</title><link rel="stylesheet" href="style.css"></head><body><h1>x</h1></body></html>';
  it("inlines the CSS in place of the stylesheet link", () => {
    const out = composePreview([{ name: "index.html", code: html }, { name: "style.css", code: "h1{color:red}" }]);
    expect(out).toContain("<style>\nh1{color:red}\n</style>");
    expect(out).not.toContain('href="style.css"');
  });
  it("still applies the CSS when the student forgot the link", () => {
    const out = composePreview([{ name: "index.html", code: "<html><head></head><body>x</body></html>" }, { name: "style.css", code: "p{}" }]);
    expect(out).toMatch(/<style>\np\{\}\n<\/style>\n<\/head>/);
    expect(composePreview([{ name: "index.html", code: "<p>hi</p>" }, { name: "style.css", code: "p{}" }])).toMatch(/^<style>/);
  });
  it("returns the HTML untouched with no CSS, and a friendly message when empty", () => {
    expect(composePreview([{ name: "index.html", code: "<p>hi</p>" }])).toBe("<p>hi</p>");
    expect(composePreview([{ name: "index.html", code: "  " }])).toContain("empty");
  });
});

describe("submission round trip", () => {
  const files = [
    { name: "index.html", code: "<h1>Hi</h1>\n<p>line</p>" },
    { name: "style.css", code: "h1 {\n  color: red;\n}" },
  ];
  it("serialises and parses back to the same files", () => {
    expect(parseSubmission(serializeSubmission(files))).toEqual(files);
  });
  it("returns null for plain text submissions (older, pasted work)", () => {
    expect(parseSubmission("just some pasted words")).toBeNull();
  });
  it("keeps saved work but picks up starter files it lacks", () => {
    const merged = mergeWithStarter([{ name: "index.html", code: "mine" }], [
      { name: "index.html", code: "starter" },
      { name: "style.css", code: "/* starter */" },
    ]);
    expect(merged).toEqual([
      { name: "index.html", code: "mine" },
      { name: "style.css", code: "/* starter */" },
    ]);
  });
});

const GOOD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ada</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header><h1>Ada</h1><nav><a href="#a">About</a></nav></header>
  <main>
    <section><h2>About</h2><p>Hi.</p><ul><li>One</li></ul><img src="a.png" alt="A smiling sun"></section>
    <section><h2>Contact</h2><form><label for="n">Name</label><input id="n"><button>Send</button></form></section>
  </main>
  <footer><a href="https://example.com">Home</a></footer>
</body>
</html>`;

const GOOD_CSS = `
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; color: #222; background-color: #fff; margin: 0; }
.card { padding: 16px; border-radius: 12px; }
nav { display: flex; gap: 12px; }
.btn { transition: all 0.3s ease; }
.btn:hover { transform: scale(1.1); }
@media (max-width: 600px) { nav { flex-direction: column; } }
`;

describe("checkWebsite", () => {
  it("passes a complete site on every check", () => {
    const results = checkWebsite([{ name: "index.html", code: GOOD_HTML }, { name: "style.css", code: GOOD_CSS }], ["html", "css"]);
    const failed = results.filter((r) => !r.ok).map((r) => r.id);
    expect(failed).toEqual([]);
    expect(summarize(results)).toMatchObject({ percent: 100 });
  });

  it("fails a bare page and says what's missing", () => {
    const results = checkWebsite([{ name: "index.html", code: "<p>hi</p>" }], ["html", "css"]);
    const passed = results.filter((r) => r.ok).map((r) => r.id);
    expect(passed).toEqual(["p"]);
    expect(results.every((r) => r.ok || r.hint.length > 5)).toBe(true);
  });

  it("only runs the requested groups", () => {
    const htmlOnly = checkWebsite([{ name: "index.html", code: GOOD_HTML }], ["html"]);
    expect(htmlOnly.every((r) => r.group === "html")).toBe(true);
    const cssOnly = checkWebsite([{ name: "style.css", code: GOOD_CSS }], ["css"]);
    expect(cssOnly.every((r) => r.group === "css")).toBe(true);
  });

  it("counts CSS written inside a <style> block", () => {
    const html = "<html><head><style>.a { display: flex; color: red; background: blue; }</style></head></html>";
    const flex = checkWebsite([{ name: "index.html", code: html }], ["css"]).find((r) => r.id === "flex");
    expect(flex?.ok).toBe(true);
  });

  it("requires alt text on every image", () => {
    const one = checkWebsite([{ name: "index.html", code: '<img src="a.png" alt="ok"><img src="b.png">' }], ["html"]).find((r) => r.id === "img");
    expect(one?.ok).toBe(false);
  });
});
