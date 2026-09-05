import { z } from "zod";

export const courseFormSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(4000),
  thumbnailUrl: z.string().max(400).optional().or(z.literal("")),
  categoryId: z.string().max(60).optional().or(z.literal("")),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  durationMinutes: z.coerce.number().int().min(0).max(100_000),
  priceCents: z.coerce.number().int().min(0).max(100_000_000),
  currency: z.string().min(3).max(3).default("NGN"),
  requirements: z.string().max(2000).optional().or(z.literal("")),
  objectives: z.string().max(2000).optional().or(z.literal("")),
});
export type CourseFormInput = z.infer<typeof courseFormSchema>;

export const moduleFormSchema = z.object({ title: z.string().min(2).max(160) });

export const lessonFormSchema = z.object({
  title: z.string().min(2).max(160),
  type: z.enum(["VIDEO", "TEXT", "PDF", "QUIZ", "ASSIGNMENT", "EXAM"]),
  videoUrl: z.string().max(500).optional().or(z.literal("")),
  content: z.string().max(20_000).optional().or(z.literal("")),
  durationSeconds: z.coerce.number().int().min(0).max(36_000).default(0),
  isPreview: z.boolean().default(false),
});
export type LessonFormInput = z.infer<typeof lessonFormSchema>;

export function linesToList(v?: string) {
  return (v ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}
