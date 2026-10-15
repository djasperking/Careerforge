/**
 * Pure helpers for the in-site code workspace used by coding assignments:
 * reading the assignment's setup out of its Markdown brief, stitching the
 * student's files into one previewable page, and saving/loading a submission.
 */

export interface WorkspaceFile {
  name: string;
  code: string;
}

export type CheckGroup = "html" | "css" | "js";

export interface WorkspaceSpec {
  /** Whether the assignment asked for the code workspace at all. */
  enabled: boolean;
  /** Which requirement checks to offer ("html", "css"). */
  checks: CheckGroup[];
  /** Starter files from the brief (always at least index.html when enabled). */
  files: WorkspaceFile[];
  /** The brief with the setup lines removed, ready to render. */
  brief: string;
}

/** Hard ceiling for a submission (the server enforces the same). */
export const MAX_SUBMISSION_CHARS = 50_000;

const MARKER = /^\s*\[\[workspace(?:\s+checks=([a-z,\s]+))?\]\]\s*$/im;
const FILE_FENCE = /^```\s*file:([\w.-]+)\s*$/;

/**
 * An assignment opts in with a `[[workspace]]` line (optionally
 * `[[workspace checks=html,css]]`) and gives starter code in fenced blocks
 * labelled ```file:index.html and ```file:style.css.
 */
export function parseWorkspaceBrief(brief: string | null | undefined): WorkspaceSpec {
  const source = (brief ?? "").replace(/\r\n/g, "\n");
  const marker = source.match(MARKER);
  if (!marker) return { enabled: false, checks: [], files: [], brief: source };

  const checks = (marker[1] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is CheckGroup => s === "html" || s === "css" || s === "js");

  const files: WorkspaceFile[] = [];
  const kept: string[] = [];
  const lines = source.replace(MARKER, "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].trim().match(FILE_FENCE);
    if (!open) {
      kept.push(lines[i]);
      continue;
    }
    const body: string[] = [];
    i++;
    while (i < lines.length && !lines[i].trim().startsWith("```")) {
      body.push(lines[i]);
      i++;
    }
    files.push({ name: open[1], code: body.join("\n") });
  }

  if (files.length === 0) files.push({ name: "index.html", code: "" });
  return { enabled: true, checks, files, brief: kept.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}

const isHtml = (f: WorkspaceFile) => /\.html?$/i.test(f.name);
const isCss = (f: WorkspaceFile) => /\.css$/i.test(f.name);
const isJs = (f: WorkspaceFile) => /\.js$/i.test(f.name);

/** True when the student wrote any JavaScript, so the preview needs scripts switched on. */
export function usesScripts(files: WorkspaceFile[]): boolean {
  return files.some((f) => isJs(f) && f.code.trim()) || files.some((f) => isHtml(f) && /<script\b/i.test(f.code));
}

/**
 * One self-contained HTML document for the preview. The student's CSS is
 * placed where their <link rel="stylesheet" href="style.css"> is — or, if they
 * forgot the link, just before </head> — so the preview works either way.
 */
export function composePreview(files: WorkspaceFile[]): string {
  const html = files.find(isHtml)?.code ?? "";
  const css = files.filter(isCss).map((f) => f.code).join("\n");
  if (!html.trim()) {
    return '<p style="font-family:sans-serif;color:#64748b;padding:24px">Your page is empty — start writing HTML on the left.</p>';
  }
  let doc = html;
  if (css.trim()) {
    const style = `<style>\n${css}\n</style>`;
    const link = /<link\b[^>]*href\s*=\s*["'][^"']*\.css["'][^>]*>/i;
    if (link.test(doc)) doc = doc.replace(link, () => style);
    else if (/<\/head>/i.test(doc)) doc = doc.replace(/<\/head>/i, () => `${style}\n</head>`);
    else doc = `${style}\n${doc}`;
  }

  // The student's script.js goes where their <script src="script.js"> is — or at the end of the page if they forgot it.
  const js = files.filter(isJs).map((f) => f.code).join("\n").replace(/<\/script/gi, "<\\/script");
  if (js.trim()) {
    const script = `<script>\n${js}\n</script>`;
    const tag = /<script\b[^>]*src\s*=\s*["'][^"']*\.js["'][^>]*>\s*<\/script>/i;
    if (tag.test(doc)) doc = doc.replace(tag, () => script);
    else if (/<\/body>/i.test(doc)) doc = doc.replace(/<\/body>/i, () => `${script}\n</body>`);
    else doc = `${doc}\n${script}`;
  }
  return doc;
}

/** The submitted text: each file under a `=== name ===` heading. */
export function serializeSubmission(files: WorkspaceFile[]): string {
  return files.map((f) => `=== ${f.name} ===\n${f.code.replace(/\s+$/, "")}`).join("\n\n") + "\n";
}

/** Reads a submission back into files; null when it isn't in the workspace format. */
export function parseSubmission(text: string | null | undefined): WorkspaceFile[] | null {
  const source = (text ?? "").replace(/\r\n/g, "\n");
  const parts = source.split(/^=== ([\w.-]+) ===$/m);
  if (parts.length < 3) return null;
  const files: WorkspaceFile[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    files.push({ name: parts[i], code: (parts[i + 1] ?? "").replace(/^\n/, "").replace(/\n+$/, "") });
  }
  return files.length ? files : null;
}

/** Fill in any starter files the saved work doesn't have (e.g. the brief gained a file). */
export function mergeWithStarter(saved: WorkspaceFile[] | null, starter: WorkspaceFile[]): WorkspaceFile[] {
  if (!saved) return starter.map((f) => ({ ...f }));
  const byName = new Map(saved.map((f) => [f.name, f]));
  const merged = starter.map((s) => ({ name: s.name, code: byName.get(s.name)?.code ?? s.code }));
  return merged;
}

export function totalChars(files: WorkspaceFile[]): number {
  return files.reduce((n, f) => n + f.code.length, 0);
}
