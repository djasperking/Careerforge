/**
 * Pure helpers for the in-site code workspace used by coding assignments:
 * reading the assignment's setup out of its Markdown brief, stitching the
 * student's files into one previewable page, and saving/loading a submission.
 */

export interface WorkspaceFile {
  name: string;
  code: string;
}

export type CheckGroup = "html" | "css";

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
    .filter((s): s is CheckGroup => s === "html" || s === "css");

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
  if (!css.trim()) return html;

  const style = `<style>\n${css}\n</style>`;
  const link = /<link\b[^>]*href\s*=\s*["'][^"']*\.css["'][^>]*>/i;
  if (link.test(html)) return html.replace(link, () => style);
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, () => `${style}\n</head>`);
  return `${style}\n${html}`;
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
