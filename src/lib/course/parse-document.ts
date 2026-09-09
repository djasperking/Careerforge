import type { CourseImportOutput, CourseImportLesson } from "@/lib/ai/types";

/**
 * AI-free best-effort parse of a syllabus / course document into a draft
 * outline. Used by the mock provider and as a fallback when the AI is
 * unavailable, so an upload always yields something editable. It never
 * invents lesson content — bodies are only filled from the document's own text.
 */

const MODULE_RE =
  /^\s*(?:module|unit|week|section|part|chapter)\s*[-:0-9.]*\s*[-:.]?\s*(.+)$/i;
const LESSON_BULLET_RE = /^\s*(?:[-*•·]|\d+[.)])\s+(.+)$/;
const QUIZ_RE = /\b(quiz|assessment|knowledge check|test)\b/i;
const ASSIGNMENT_RE = /\b(assignment|project|exercise|lab|practical|worksheet)\b/i;
const VIDEO_RE = /\b(video|lecture|screencast|walkthrough|demo)\b/i;

function lessonType(title: string): CourseImportLesson["type"] {
  if (QUIZ_RE.test(title)) return "QUIZ";
  if (ASSIGNMENT_RE.test(title)) return "ASSIGNMENT";
  if (VIDEO_RE.test(title)) return "VIDEO";
  return "TEXT";
}

function titleCaseHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (/[.:;]$/.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length > 10) return false;
  const caps = words.filter((w) => /^[A-Z0-9]/.test(w)).length;
  return caps / words.length > 0.6;
}

export function heuristicCourseParse(rawText: string): CourseImportOutput {
  const text = rawText.replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);

  const title = (nonEmpty[0] ?? "Imported course").replace(/^#+\s*/, "").slice(0, 150);

  // Description: first paragraph after the title that reads like prose.
  const description =
    nonEmpty
      .slice(1)
      .find((l) => l.length > 60 && /[a-z]/.test(l) && !MODULE_RE.test(l)) ??
    "Imported from a document — add a fuller description before publishing.";

  const objectives: string[] = [];
  let inObjectives = false;
  for (const l of lines) {
    if (/^\s*(learning\s+)?(objectives|outcomes|goals|you will learn|what you'?ll learn)/i.test(l)) {
      inObjectives = true;
      continue;
    }
    if (inObjectives) {
      const m = l.match(LESSON_BULLET_RE);
      if (m) objectives.push(m[1].trim().slice(0, 160));
      else if (l.trim() === "" && objectives.length) inObjectives = false;
      else if (MODULE_RE.test(l)) inObjectives = false;
    }
    if (objectives.length >= 8) break;
  }

  // Modules + lessons. Only fall back to title-case headings as module
  // markers when the document has no explicit "Module/Unit/Week" lines.
  const hasExplicitModules = lines.some((l) => MODULE_RE.test(l.trim()));
  const modules: CourseImportOutput["modules"] = [];
  let current: CourseImportOutput["modules"][number] | null = null;
  let pendingBody: string[] = [];
  let seenNonTitleLine = false;

  const flushBody = () => {
    if (current && current.lessons.length && pendingBody.length) {
      const joined = pendingBody.join("\n").trim();
      if (joined.length > 40) {
        current.lessons[current.lessons.length - 1].content = joined.slice(0, 8000);
      }
    }
    pendingBody = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const mod = line.match(MODULE_RE);
    const titleFallback =
      !hasExplicitModules && seenNonTitleLine && !current && titleCaseHeading(line);
    seenNonTitleLine = true;
    if (mod || titleFallback) {
      flushBody();
      current = { title: (mod ? mod[1] : line).trim().slice(0, 150), lessons: [] };
      modules.push(current);
      continue;
    }
    const bullet = line.match(LESSON_BULLET_RE);
    if (bullet && current) {
      flushBody();
      const lt = bullet[1].trim();
      current.lessons.push({ title: lt.slice(0, 150), type: lessonType(lt), content: "" });
      continue;
    }
    if (current && current.lessons.length) pendingBody.push(raw);
  }
  flushBody();

  // Nothing recognised — fall back to one module holding the whole text.
  if (modules.length === 0) {
    modules.push({
      title: "Course content",
      lessons: [{ title: "Imported notes", type: "TEXT", content: text.slice(0, 8000) }],
    });
  }

  const trimmedModules = modules
    .filter((m) => m.title)
    .slice(0, 20)
    .map((m) => ({
      title: m.title,
      lessons: (m.lessons.length ? m.lessons : [{ title: "Lesson 1", type: "TEXT" as const, content: "" }]).slice(0, 30),
    }));

  return {
    title,
    description: description.slice(0, 2000),
    level: "BEGINNER",
    objectives,
    modules: trimmedModules,
    notes: [
      "This outline was built automatically from your document. Check every module and lesson title before publishing.",
      "Only text that was actually in the document has been added — no lesson content was invented.",
      "Add videos, images, quizzes and files in the course builder.",
    ],
  };
}
