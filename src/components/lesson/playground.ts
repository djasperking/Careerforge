/**
 * Turns the `.cf-playground` blocks that renderMarkdown emits into an editable
 * live-preview: a code box on one side, the rendered result on the other.
 *
 * The preview is an <iframe> with `sandbox=""` — no scripts, no forms, no
 * same-origin access — so whatever a student types can never touch the site.
 * Plain DOM (no React) because the blocks arrive as an HTML string.
 */

const DONE = "cfEnhanced";
const IDLE = '<p style="font:13px sans-serif;color:#64748b;padding:10px">Press ▶ Run to see the output here.</p>';

/** A page that shows everything the student's JavaScript prints with console.log, then runs their code. */
function jsDocument(code: string): string {
  const safe = code.replace(/<\/script/gi, "<\\/script");
  return (
    '<style>body{font:13px ui-monospace,Consolas,monospace;margin:0;padding:10px;color:#0f172a}' +
    '.l{border-bottom:1px solid #e2e8f0;padding:4px 0;white-space:pre-wrap}.e{color:#b91c1c}.h{color:#64748b;font-style:italic}</style>' +
    '<div id="o"></div>' +
    "<script>var o=document.getElementById('o');o.textContent='';" +
    "function w(c,a){var d=document.createElement('div');d.className='l '+c;" +
    "d.textContent=a.map(function(x){try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ');o.appendChild(d)}" +
    "console.log=function(){w('',[].slice.call(arguments))};console.error=function(){w('e',[].slice.call(arguments))};" +
    "window.onerror=function(m){w('e',[m])};</script>" +
    "<script>try{\n" + safe + "\n}catch(e){w('e',[String(e)])}</script>"
  );
}

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
  const isJs = host.dataset.lang === "js";
  const needsRun = isJs || /<script/i.test(original);

  const card = el("div", "not-prose my-5 overflow-hidden rounded-xl border bg-card shadow-sm");

  const header = el("div", "flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-3 py-2");
  const label = el("span", "text-xs font-semibold", "🧪 Try it yourself");
  const status = el("span", "text-xs text-muted-foreground", title || "Edit the code — the result updates as you type.");
  const left = el("div", "flex flex-col gap-0.5");
  left.append(label, status);
  const reset = el("button", "rounded-md border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted", "↺ Reset");
  reset.type = "button";
  const buttons = el("div", "flex items-center gap-2");
  const run = el("button", "rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90", "▶ Run");
  run.type = "button";
  if (needsRun) buttons.append(run);
  buttons.append(reset);
  header.append(left, buttons);

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
  frame.setAttribute("sandbox", needsRun ? "allow-scripts" : ""); // never allow-same-origin: nothing the student writes can reach the site, its cookies or storage
  frame.setAttribute("title", "Live preview of your code");
  frame.setAttribute("loading", "lazy");

  body.append(editor, frame);
  card.append(header, body);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let celebrated = false;
  const render = () => {
    frame.srcdoc = isJs ? jsDocument(editor.value) : editor.value;
  };
  const renderIdle = () => {
    // Scripts only run when the student presses Run, so a typo like an endless loop can't freeze the lesson while typing.
    if (!needsRun) render();
  };
  run.addEventListener("click", () => {
    frame.srcdoc = "";
    setTimeout(render, 30);
  });

  editor.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(renderIdle, 200);
    if (!celebrated && editor.value !== original) {
      celebrated = true;
      card.dispatchEvent(new CustomEvent("cf-edit", { bubbles: true }));
      status.textContent = "🎉 Nice — you just changed real code!";
      status.className = "text-xs font-medium text-primary";
    }
  });

  reset.addEventListener("click", () => {
    editor.value = original;
    if (needsRun) frame.srcdoc = isJs ? IDLE : "";
    else render();
    celebrated = false;
    status.textContent = title || "Back to the starting code. Try again!";
    status.className = "text-xs text-muted-foreground";
  });

  if (isJs) frame.srcdoc = IDLE;
  else if (needsRun) frame.srcdoc = original.replace(/<script[\s\S]*?<\/script>/gi, "");
  else render();
  host.replaceChildren(card);
}

/** Upgrade every playground inside `root`. Safe to call repeatedly. */
export function enhancePlaygrounds(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".cf-playground").forEach(enhanceOne);
}
