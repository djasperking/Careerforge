import { z } from "zod";
import type { CourseImportOutput } from "@/lib/ai/types";

const lessonSchema = z.object({
  title: z.string().trim().min(1).max(150).catch("Untitled lesson"),
  type: z.enum(["TEXT", "VIDEO", "QUIZ", "ASSIGNMENT"]).catch("TEXT"),
  content: z.string().max(18_000).catch("").default(""),
});

const importSchema = z.object({
  title: z.string().trim().min(1).max(150).catch("Imported course"),
  description: z.string().trim().max(2000).catch(""),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).catch("BEGINNER"),
  objectives: z.array(z.string().trim().min(1).max(160)).max(20).catch([]),
  modules: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(150).catch("Module"),
        lessons: z.array(lessonSchema).max(40).catch([]),
      }),
    )
    .max(30)
    .catch([]),
  notes: z.array(z.string().trim().min(1).max(400)).max(12).catch([]),
});

/** Normalise a loosely-shaped AI/heuristic result into a safe CourseImportOutput. */
export function coerceCourseImport(raw: unknown): CourseImportOutput {
  const parsed = importSchema.parse(raw ?? {});
  // Drop empty modules; guarantee at least one module with one lesson.
  let modules = parsed.modules
    .map((m) => ({
      title: m.title,
      lessons: m.lessons.length ? m.lessons : [{ title: "Lesson 1", type: "TEXT" as const, content: "" }],
    }))
    .filter((m) => m.title);
  if (modules.length === 0) {
    modules = [{ title: "Course content", lessons: [{ title: "Lesson 1", type: "TEXT", content: "" }] }];
  }
  const description =
    parsed.description.length >= 10
      ? parsed.description
      : "Imported from a document — add a fuller description before publishing.";
  return { ...parsed, description, modules };
}

/** Rough total lesson count for messaging. */
export function countImportLessons(out: CourseImportOutput): number {
  return out.modules.reduce((n, m) => n + m.lessons.length, 0);
}
