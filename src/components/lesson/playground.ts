/**
 * Turns the `.cf-playground` blocks that renderMarkdown emits into an editable
 * live-preview: a code box on one side, the rendered result on the other.
 *
 * The preview is an <iframe> with `sandbox=""` — no scripts, no forms, no
 * same-origin access — so whatever a student types can never touch the site.
 * Plain DOM (no React) because the blocks arrive as an HTML string.
 */

const DONE = "cfEnhanced";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function enhanceOne(host: HTMLElement) {
  if (host.dataset[DONE]) return;
  host.dataset[DONE] = "1";

  const original = host.dataset.code ?? "";
  const title = (host.dataset.title ?? "").trim();

  const card = el("div", "not-prose my-5 overflow-hidden rounded-xl border bg-card shadow-sm");

  const header = el("div", "flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-3 py-2");
  const label = el("span", "text-xs font-semibold", "🧪 Try it yourself");
  const status = el("span", "text-xs text-muted-foreground", title || "Edit the code — the result updates as you type.");
  const left = el("div", "flex flex-col gap-0.5");
  left.append(label, status);
  const reset = el("button", "rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted", "↺ Reset");
  reset.type = "button";
  header.append(left, reset);

  const body = el("div", "grid md:grid-cols-2");
  const editor = document.createElement("textarea");
  editor.className =
    "h-64 w-full resize-y border-b bg-background p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40 md:border-b-0 md:border-r";
  editor.spellcheck = false;
  editor.setAttribute("aria-label", "Code editor");
  editor.setAttribute("autocapitalize", "off");
  editor.setAttribute("autocomplete", "off");
  editor.value = original;

  const frame = document.createElement("iframe");
  frame.className = "h-64 w-full bg-white";
  frame.setAttribute("sandbox", ""); // the important line: nothing the student writes can run script or reach the site
  frame.setAttribute("title", "Live preview of your code");
  frame.setAttribute("loading", "lazy");

  body.append(editor, frame);
  card.append(header, body);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let celebrated = false;
  const render = () => {
    frame.srcdoc = editor.value;
  };

  editor.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(render, 200);
    if (!celebrated && editor.value !== original) {
      celebrated = true;
      status.textContent = "🎉 Nice — you just changed real code!";
      status.className = "text-xs font-medium text-primary";
    }
  });

  reset.addEventListener("click", () => {
    editor.value = original;
    render();
    celebrated = false;
    status.textContent = title || "Back to the starting code. Try again!";
    status.className = "text-xs text-muted-foreground";
  });

  render();
  host.replaceChildren(card);
}

/** Upgrade every playground inside `root`. Safe to call repeatedly. */
export function enhancePlaygrounds(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".cf-playground").forEach(enhanceOne);
}
