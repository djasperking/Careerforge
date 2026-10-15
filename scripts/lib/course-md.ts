/**
 * Reads a course written as one Markdown file:
 *
 *   ---
 *   key: javascript-from-zero
 *   title: ...
 *   description: ...
 *   category: web-development | Web Development
 *   level: BEGINNER
 *   requirements: one; two; three
 *   objectives: one; two; three
 *   thumb: TOP | HEADLINE | sub line | chip one | chip two | 🚀 | #from | #via | #to
 *   ---
 *   # MODULE: Module title
 *   === TEXT: Lesson title | 420 | preview
 *   ...markdown...
 *   === QUIZ: Quiz title | 300
 *   ? Question text
 *   + the right answer
 *   - a wrong answer
 *   = explanation (optional)
 *   === ASSIGNMENT: Title | 2400
 *   ...markdown brief (may use [[workspace ...]])...
 */
import type { CourseSpec, LessonSpec, QuizQ } from "./course-seed";
import { q as mcq, tf } from "./course-seed";

function parseQuiz(lines: string[]): QuizQ[] {
  const out: QuizQ[] = [];
  let cur: { prompt: string; correct: string[]; wrong: string[]; explain: string } | null = null;
  const flush = () => {
    if (!cur) return;
    const answers = [...cur.correct, ...cur.wrong].map((a) => a.toLowerCase());
    if (cur.correct.length !== 1 || answers.length < 2) throw new Error(`Bad quiz question: ${cur.prompt}`);
    if (answers.length === 2 && answers.includes("true") && answers.includes("false")) {
      out.push(tf(cur.prompt, cur.correct[0].toLowerCase() === "true", cur.explain));
    } else {
      out.push(mcq(cur.prompt, cur.correct[0], cur.wrong, cur.explain));
    }
    cur = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("? ")) {
      flush();
      cur = { prompt: line.slice(2).trim(), correct: [], wrong: [], explain: "" };
    } else if (cur && line.startsWith("+ ")) cur.correct.push(line.slice(2).trim());
    else if (cur && line.startsWith("- ")) cur.wrong.push(line.slice(2).trim());
    else if (cur && line.startsWith("= ")) cur.explain = line.slice(2).trim();
  }
  flush();
  return out;
}

export function parseCourseMarkdown(source: string): CourseSpec {
  const text = source.replace(/\r\n/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error("Course file needs a --- header ---");
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const list = (s = "") => s.split(";").map((x) => x.trim()).filter(Boolean);
  const [catKey, catName] = (meta.category ?? "").split("|").map((s) => s.trim());
  const t = (meta.thumb ?? "").split("|").map((s) => s.trim());
  if (!meta.key || !meta.title || !catKey || t.length < 9) throw new Error(`Course header incomplete (${meta.key ?? "?"})`);

  const spec: CourseSpec = {
    key: meta.key,
    title: meta.title,
    description: meta.description,
    category: { key: catKey, name: catName || catKey },
    level: (meta.level as CourseSpec["level"]) || "BEGINNER",
    requirements: list(meta.requirements),
    objectives: list(meta.objectives),
    thumb: { top: t[0], headline: t[1], sub: t[2], chips: [t[3], t[4]], emoji: t[5], from: t[6], via: t[7], to: t[8] },
    modules: [],
  };

  // Walk the body line by line (a fence-aware scan so "=== " inside code never splits a lesson).
  let mod: CourseSpec["modules"][number] | null = null;
  let lesson: { head: { kind: string; title: string; seconds: number; preview: boolean }; lines: string[] } | null = null;
  let fence = false;

  const closeLesson = () => {
    if (!lesson || !mod) return;
    const { head, lines } = lesson;
    const body = lines.join("\n").trim();
    const l: LessonSpec = { title: head.title, type: head.kind as LessonSpec["type"], seconds: head.seconds, preview: head.preview };
    if (head.kind === "QUIZ") l.quiz = { title: head.title.replace(/^[^\p{L}\p{N}]+/u, "").trim() || head.title, questions: parseQuiz(lines) };
    else l.content = body;
    mod.lessons.push(l);
    lesson = null;
  };

  for (const line of m[2].split("\n")) {
    if (line.trim().startsWith("```")) fence = !fence;
    if (!fence) {
      const mm = line.match(/^# MODULE:\s*(.+)$/);
      if (mm) {
        closeLesson();
        mod = { title: mm[1].trim(), lessons: [] };
        spec.modules.push(mod);
        continue;
      }
      const lm = line.match(/^=== (TEXT|QUIZ|ASSIGNMENT):\s*(.+)$/);
      if (lm) {
        closeLesson();
        const [title, seconds, flag] = lm[2].split("|").map((s) => s.trim());
        lesson = { head: { kind: lm[1], title, seconds: Number(seconds) || 300, preview: flag === "preview" }, lines: [] };
        continue;
      }
    }
    lesson?.lines.push(line);
  }
  closeLesson();

  if (spec.modules.length === 0) throw new Error(`${spec.key}: no modules`);
  return spec;
}
