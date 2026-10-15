import type { CheckGroup, WorkspaceFile } from "./workspace";

/**
 * A friendly, instant self-check for the student's website. It looks for the
 * things the course taught — it can't judge design or code quality, so it
 * never blocks a submission; the instructor still reviews the work.
 */
export interface CheckResult {
  id: string;
  group: CheckGroup;
  label: string;
  hint: string;
  ok: boolean;
}

interface Check {
  id: string;
  group: CheckGroup;
  label: string;
  hint: string;
  test: (src: { html: string; css: string; js: string }) => boolean;
}

const has = (re: RegExp, s: string) => re.test(s);

const CHECKS: Check[] = [
  // ---- HTML ----
  { id: "doctype", group: "html", label: "Starts with <!DOCTYPE html>", hint: "Put <!DOCTYPE html> on the very first line.", test: ({ html }) => has(/<!doctype\s+html/i, html) },
  { id: "lang", group: "html", label: "<html> has a lang attribute", hint: 'Write <html lang="en">.', test: ({ html }) => has(/<html[^>]*\blang\s*=/i, html) },
  { id: "title", group: "html", label: "Page has a <title>", hint: "Add <title>My page</title> inside <head>.", test: ({ html }) => has(/<title>\s*\S[^<]*<\/title>/i, html) },
  { id: "viewport", group: "html", label: "Viewport meta tag (for phones)", hint: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> in <head>.', test: ({ html }) => has(/<meta[^>]*name\s*=\s*["']viewport["']/i, html) },
  { id: "h1", group: "html", label: "A main heading (<h1>)", hint: "Use one <h1> for the page's main title.", test: ({ html }) => has(/<h1[\s>]/i, html) },
  { id: "h2", group: "html", label: "Section headings (<h2>)", hint: "Give each section an <h2> heading.", test: ({ html }) => has(/<h2[\s>]/i, html) },
  { id: "p", group: "html", label: "Paragraphs (<p>)", hint: "Write some text inside <p> tags.", test: ({ html }) => has(/<p[\s>]/i, html) },
  { id: "header", group: "html", label: "A <header>", hint: "Wrap your page's top area in <header>.", test: ({ html }) => has(/<header[\s>]/i, html) },
  { id: "nav", group: "html", label: "A <nav> with links", hint: "Put your menu links inside <nav>.", test: ({ html }) => has(/<nav[\s>][\s\S]*<a\s[^>]*href/i, html) },
  { id: "main", group: "html", label: "A <main> area", hint: "Wrap the main content in <main>.", test: ({ html }) => has(/<main[\s>]/i, html) },
  { id: "section", group: "html", label: "At least one <section> or <article>", hint: "Group content with <section>.", test: ({ html }) => has(/<(section|article)[\s>]/i, html) },
  { id: "footer", group: "html", label: "A <footer>", hint: "Finish the page with a <footer>.", test: ({ html }) => has(/<footer[\s>]/i, html) },
  { id: "link", group: "html", label: "A link (<a href>)", hint: 'Add <a href="https://example.com">a link</a>.', test: ({ html }) => has(/<a\s[^>]*href\s*=\s*["'][^"']+["']/i, html) },
  {
    id: "img",
    group: "html",
    label: "An image, with alt text on every image",
    hint: 'Add <img src="..." alt="a short description">. Every image needs alt.',
    test: ({ html }) => {
      const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
      return imgs.length > 0 && imgs.every((i) => has(/\balt\s*=\s*["'][^"']+["']/i, i));
    },
  },
  { id: "list", group: "html", label: "A list (<ul> or <ol> with <li>)", hint: "Make a list with <ul> and <li> items.", test: ({ html }) => has(/<(ul|ol)[\s>]/i, html) && has(/<li[\s>]/i, html) },
  {
    id: "form",
    group: "html",
    label: "A form with labels, inputs and a button",
    hint: "Build a <form> with <label>, <input> and a <button>.",
    test: ({ html }) => has(/<form[\s>]/i, html) && has(/<label[\s>]/i, html) && has(/<input[\s>]/i, html) && has(/<button[\s>]|type\s*=\s*["']submit["']/i, html),
  },

  // ---- CSS ----
  { id: "css", group: "css", label: "You have some CSS", hint: "Write rules in style.css (or a <style> block).", test: ({ css }) => css.trim().length > 20 },
  { id: "element", group: "css", label: "An element selector (like body or h1)", hint: "Style a tag directly: h1 { color: tomato; }", test: ({ css }) => has(/(^|[}\s,])(body|h1|h2|h3|p|a|nav|header|footer|section|main|button)\s*[{,]/im, css) },
  { id: "class", group: "css", label: "A class selector (like .card)", hint: "Make a class: .card { padding: 16px; } and add class=\"card\" in your HTML.", test: ({ css }) => has(/\.[a-zA-Z_][\w-]*[^{}]*\{/, css) },
  { id: "colours", group: "css", label: "Text and background colours", hint: "Use color and background-color.", test: ({ css }) => has(/(^|[;{\s])color\s*:/i, css) && has(/background(-color)?\s*:/i, css) },
  { id: "font", group: "css", label: "A font-family", hint: "Set font-family: Arial, sans-serif;", test: ({ css }) => has(/font-family\s*:/i, css) },
  { id: "box", group: "css", label: "Padding and margin", hint: "Use padding (inside) and margin (outside).", test: ({ css }) => has(/padding\s*:/i, css) && has(/margin\s*:/i, css) },
  { id: "cards", group: "css", label: "Rounded corners or a shadow", hint: "Try border-radius: 12px; or box-shadow.", test: ({ css }) => has(/border-radius\s*:|box-shadow\s*:/i, css) },
  { id: "flex", group: "css", label: "Flexbox layout (display: flex)", hint: "Put display: flex; on a container.", test: ({ css }) => has(/display\s*:\s*(inline-)?flex/i, css) },
  { id: "hover", group: "css", label: "A :hover effect", hint: "Add a rule like .btn:hover { ... }", test: ({ css }) => has(/:hover/i, css) },
  { id: "transition", group: "css", label: "A transition (smooth change)", hint: "Add transition: all 0.3s ease;", test: ({ css }) => has(/transition\s*:/i, css) },
  { id: "media", group: "css", label: "A media query (responsive)", hint: "Add @media (max-width: 600px) { ... }", test: ({ css }) => has(/@media[^{]*\(/i, css) },

  // ---- JavaScript ----
  { id: "js", group: "js", label: "You have some JavaScript", hint: "Write code in script.js.", test: ({ js }) => js.trim().length > 20 },
  { id: "vars", group: "js", label: "Variables (let or const)", hint: "Store a value: const name = \"Ada\";", test: ({ js }) => has(/\b(let|const)\s+\w+/, js) },
  { id: "function", group: "js", label: "A function", hint: "Write function greet() { ... } or an arrow function.", test: ({ js }) => has(/\bfunction\s+\w+\s*\(|=>\s*[{(\w]/, js) },
  { id: "if", group: "js", label: "An if statement", hint: "Make a decision: if (score > 5) { ... }", test: ({ js }) => has(/\bif\s*\(/, js) },
  { id: "loop", group: "js", label: "A loop or array method", hint: "Use for (...) { }, while, or .forEach / .map.", test: ({ js }) => has(/\bfor\s*\(|\bwhile\s*\(|\.(forEach|map|filter)\s*\(/, js) },
  { id: "array", group: "js", label: "An array", hint: "Make a list: const fruits = [\"mango\", \"pawpaw\"];", test: ({ js }) => has(/=\s*\[[^\]]*\]/, js) },
  { id: "dom", group: "js", label: "Finds an element on the page", hint: "Use document.querySelector(\"#id\") or getElementById.", test: ({ js }) => has(/document\.(querySelector|getElementById|querySelectorAll)/, js) },
  { id: "event", group: "js", label: "Reacts to a click or input", hint: "Use button.addEventListener(\"click\", () => { ... });", test: ({ js }) => has(/addEventListener\s*\(/, js) },
  { id: "update", group: "js", label: "Changes the page (textContent / innerHTML / style)", hint: "Update something: output.textContent = \"Hi!\";", test: ({ js }) => has(/\.(textContent|innerText|innerHTML|classList|style)\b/, js) },
];

/** Everything the student wrote, split into the HTML text and all the CSS (files + <style> blocks). */
function sources(files: WorkspaceFile[]) {
  const html = files.filter((f) => /\.html?$/i.test(f.name)).map((f) => f.code).join("\n");
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  const css = [...files.filter((f) => /\.css$/i.test(f.name)).map((f) => f.code), ...styleBlocks].join("\n");
  const scriptBlocks = [...html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const js = [...files.filter((f) => /\.js$/i.test(f.name)).map((f) => f.code), ...scriptBlocks].join("\n");
  return { html, css, js };
}

export function checkWebsite(files: WorkspaceFile[], groups: CheckGroup[]): CheckResult[] {
  const src = sources(files);
  return CHECKS.filter((c) => groups.includes(c.group)).map(({ test, ...c }) => ({ ...c, ok: test(src) }));
}

export function summarize(results: CheckResult[]) {
  const passed = results.filter((r) => r.ok).length;
  return { passed, total: results.length, percent: results.length ? Math.round((passed / results.length) * 100) : 0 };
}
