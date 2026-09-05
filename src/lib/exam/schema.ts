import { z } from "zod";

export const examSettingsSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional().or(z.literal("")),
  courseId: z.string().max(60).optional().or(z.literal("")),
  timeLimitMinutes: z.coerce.number().int().min(1).max(600),
  questionCount: z.coerce.number().int().min(1).max(200),
  passingScore: z.coerce.number().int().min(0).max(100),
  maxAttempts: z.coerce.number().int().min(1).max(20),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
  gradingMode: z.enum(["AUTO", "MANUAL", "HYBRID"]).default("AUTO"),
  revealAnswers: z.boolean().default(false),
});
export type ExamSettingsInput = z.infer<typeof examSettingsSchema>;

export const questionFormSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER", "SHORT_ANSWER", "ESSAY", "SCENARIO"]),
  prompt: z.string().min(3).max(2000),
  explanation: z.string().max(1000).optional().or(z.literal("")),
  points: z.coerce.number().int().min(1).max(100),
  difficulty: z.string().max(20).optional().or(z.literal("")),
  topic: z.string().max(120).optional().or(z.literal("")),
  options: z
    .array(z.object({ text: z.string().min(1).max(400), isCorrect: z.boolean() }))
    .max(10)
    .default([]),
});
export type QuestionFormInput = z.infer<typeof questionFormSchema>;

export const aiQuestionGenSchema = z.object({
  topic: z.string().min(2).max(160),
  difficulty: z.enum(["easy", "medium", "hard"]),
  count: z.coerce.number().int().min(1).max(15),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_ANSWER", "SHORT_ANSWER"]),
});
