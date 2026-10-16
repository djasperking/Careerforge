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
 *
 * A scored practice drill (like the "gold tasks" annotators are tested on):
 *
 *     ::: drill Sentiment practice
 *     labels: Positive | Negative | Neutral
 *     rule: Label the writer's feeling. Facts with no feeling are Neutral.
 *     pass: 70
 *     - The food arrived hot and on time. => Positive | It praises the delivery.
 *     - The shop opens at 9am. => Neutral | A fact, no feeling.
 *     :::
 */

export interface StepCheck {
  question: string;
  options: { text: string; correct: boolean }[];
  explain: string;
}

export interface DrillItem {
  text: string;
  answer: string;
  why: string;
}

export interface StepDrill {
  title: string;
  labels: string[];
  rule: string;
  passPercent: number;
  items: DrillItem[];
}

export interface LessonStep {
  title: string;
  /** Markdown for the step, with its questions removed. */
  body: string;
  checks: StepCheck[];
  drills: StepDrill[];
  hasPlayground: boolean;
  /** Lines from 📌 / 🔑 callouts, collected for the end-of-lesson recap. */
  keyPoints: string[];
}

const CHECK_OPEN = /^:::\s*check\s+(.+)$/;
const DRILL_OPEN = /^:::\s*drill\s+(.+)$/;

function parseChecks(lines: string[]): { rest: string[]; checks: StepCheck[]; drills: StepDrill[] } {
  const rest: string[] = [];
  const checks: StepCheck[] = [];
  const drills: StepDrill[] = [];
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) fence = !fence;
    const drillOpen = fence ? null : line.trim().match(DRILL_OPEN);
    if (drillOpen) {
      const drill: StepDrill = { title: drillOpen[1].trim(), labels: [], rule: "", passPercent: 70, items: [] };
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") {
        const t = lines[i].trim();
        if (t.startsWith("labels:")) drill.labels = t.slice(7).split("|").map((x) => x.trim()).filter(Boolean);
        else if (t.startsWith("rule:")) drill.rule = t.slice(5).trim();
        else if (t.startsWith("pass:")) drill.passPercent = Math.min(100, Math.max(1, Number(t.slice(5)) || 70));
        else if (t.startsWith("- ") && t.includes("=>")) {
          const [text, rest2] = t.slice(2).split("=>");
          const [answer, ...why] = rest2.split("|");
          drill.items.push({ text: text.trim(), answer: answer.trim(), why: why.join("|").trim() });
        }
        i++;
      }
      // A drill needs two or more labels and at least three items whose answers are real labels.
      if (drill.labels.length >= 2 && drill.items.length >= 3 && drill.items.every((it) => drill.labels.includes(it.answer))) {
        drills.push(drill);
      }
      continue;
    }
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
  return { rest, checks, drills };
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
    const { rest, checks, drills } = parseChecks(g.lines);
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
    steps.push({ title, body: text, checks, drills, hasPlayground: /^```playground(-js)?\b/m.test(text), keyPoints });
  }
  return steps;
}
