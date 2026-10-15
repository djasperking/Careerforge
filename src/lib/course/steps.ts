/**
 * Turns a text lesson's Markdown into bite-sized steps so students learn one
 * topic at a time. A step starts at every `### ` heading (the lesson's `## `
 * title and anything before the first `###` is the opening step).
 *
 * Authors can add a quick question to any step:
 *
 *     ::: check Which tag closes a paragraph?
 *     - <p>
 *     + </p>
 *     - <end>
 *     = Closing tags always start with a slash.
 *     :::
 *
 * `+` marks the right answer, `-` a wrong one, `=` is the explanation shown after.
 */

export interface StepCheck {
  question: string;
  options: { text: string; correct: boolean }[];
  explain: string;
}

export interface LessonStep {
  title: string;
  /** Markdown for the step, with its questions removed. */
  body: string;
  checks: StepCheck[];
  hasPlayground: boolean;
  /** Lines from 📌 / 🔑 callouts, collected for the end-of-lesson recap. */
  keyPoints: string[];
}

const CHECK_OPEN = /^:::\s*check\s+(.+)$/;

function parseChecks(lines: string[]): { rest: string[]; checks: StepCheck[] } {
  const rest: string[] = [];
  const checks: StepCheck[] = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) fence = !fence;
    const open = fence ? null : line.trim().match(CHECK_OPEN);
    if (!open) {
      rest.push(line);
      continue;
    }
    const check: StepCheck = { question: open[1].trim(), options: [], explain: "" };
    i++;
    while (i < lines.length && lines[i].trim() !== ":::") {
      const t = lines[i].trim();
      if (t.startsWith("+ ")) check.options.push({ text: t.slice(2).trim(), correct: true });
      else if (t.startsWith("- ")) check.options.push({ text: t.slice(2).trim(), correct: false });
      else if (t.startsWith("= ")) check.explain = t.slice(2).trim();
      i++;
    }
    // A question needs at least two answers and exactly one right one to be fair.
    if (check.options.length >= 2 && check.options.filter((o) => o.correct).length === 1) checks.push(check);
  }
  return { rest, checks };
}

function titleOf(heading: string): string {
  return heading.replace(/^#{1,3}\s+/, "").trim();
}

export function splitSteps(markdown: string | null | undefined): LessonStep[] {
  const lines = (markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const groups: { title: string; lines: string[] }[] = [{ title: "", lines: [] }];
  let fence = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) fence = !fence;
    if (!fence && /^###\s+/.test(line)) groups.push({ title: titleOf(line), lines: [] });
    else groups[groups.length - 1].lines.push(line);
  }

  const steps: LessonStep[] = [];
  for (const g of groups) {
    const { rest, checks } = parseChecks(g.lines);
    const body = rest.join("\n").trim();
    if (!body && !g.title) continue;
    let title = g.title;
    let text = body;
    if (!title) {
      // The opening step takes its name from the lesson's own `## ` heading.
      const m = text.match(/^##\s+(.+)$/m);
      title = m ? m[1].trim() : "Let's begin";
      text = text.replace(/^##\s+.+\n?/m, "").trim();
    }
    const keyPoints = [...text.matchAll(/^>\s*(?:📌|🔑)\s*(.+)$/gmu)].map((m) => m[1].trim());
    steps.push({ title, body: text, checks, hasPlayground: /^```playground\b/m.test(text), keyPoints });
  }
  return steps;
}
