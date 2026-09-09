/**
 * Provider-agnostic AI contract. Every feature in Career Forge calls these
 * functions — never a provider SDK directly — so the provider can be swapped
 * (or mocked) from a single place. All keys stay server-side.
 */

export interface AIContext {
  userId?: string;
  /** Feature key, matches AIPrompt.key and AIUsage.feature. */
  feature: string;
}

export interface AIResult<T> {
  data: T;
  meta: {
    provider: string;
    model: string;
    promptTokens: number;
    outputTokens: number;
    latencyMs: number;
    isAIGenerated: true;
  };
}

export interface CVGenerationInput {
  role?: string;
  seniority?: string;
  rawProfile: Record<string, unknown>;
  targetJobDescription?: string;
}

export interface CVImportInput {
  /** Raw text of the candidate's existing CV (extracted from an upload or pasted). */
  rawText: string;
  /** If given, the parsed CV is re-ordered and re-phrased to target this role. */
  targetJobDescription?: string;
}

export interface CVImportOutput {
  /** Loosely-shaped CV document; caller runs it through coerceCvContent(). */
  content: Record<string, unknown>;
  /** Plain-language notes on what was changed / what the user should verify. */
  tailoringNotes: string[];
}

export interface CVAnalysisInput {
  cv: Record<string, unknown>;
  jobDescription: string;
}

export interface CVAnalysisOutput {
  matchScore: number;
  missingKeywords: string[];
  missingSkills: string[];
  weakSections: string[];
  suggestions: { section: string; suggestion: string; requiresVerification: boolean }[];
  atsRecommendations: string[];
  improvedSummary: string;
}

export interface QuestionGenInput {
  courseTitle?: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_ANSWER" | "SHORT_ANSWER";
}

export interface GeneratedQuestion {
  prompt: string;
  options: { text: string; isCorrect: boolean }[];
  correctAnswerText?: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

export interface CourseImportInput {
  /** Raw text of a syllabus, outline or full course document. */
  rawText: string;
}

export interface CourseImportLesson {
  title: string;
  type: "TEXT" | "VIDEO" | "QUIZ" | "ASSIGNMENT";
  /** Lesson body in Markdown — only when the source document actually contained it. */
  content: string;
}

export interface CourseImportOutput {
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  objectives: string[];
  modules: { title: string; lessons: CourseImportLesson[] }[];
  /** What the AI could and couldn't pull from the document. */
  notes: string[];
}

export interface AIProvider {
  name: string;
  generateCV(input: CVGenerationInput, ctx: AIContext): Promise<AIResult<Record<string, unknown>>>;
  importCV(input: CVImportInput, ctx: AIContext): Promise<AIResult<CVImportOutput>>;
  analyzeCV(input: CVAnalysisInput, ctx: AIContext): Promise<AIResult<CVAnalysisOutput>>;
  generateCoverLetter(
    input: { cv: Record<string, unknown>; jobDescription: string; tone?: string },
    ctx: AIContext,
  ): Promise<AIResult<{ coverLetter: string }>>;
  careerAdvice(
    input: { question: string; history?: { role: "user" | "assistant"; content: string }[] },
    ctx: AIContext,
  ): Promise<AIResult<{ reply: string }>>;
  generateCourseOutline(
    input: { title: string; audience?: string; goals?: string[] },
    ctx: AIContext,
  ): Promise<AIResult<{ modules: { title: string; lessons: string[] }[] }>>;
  importCourseFromText(
    input: CourseImportInput,
    ctx: AIContext,
  ): Promise<AIResult<CourseImportOutput>>;
  generateQuestions(input: QuestionGenInput, ctx: AIContext): Promise<AIResult<GeneratedQuestion[]>>;
  gradeAnswer(
    input: { question: string; rubric?: string; answer: string; maxPoints: number },
    ctx: AIContext,
  ): Promise<AIResult<{ awardedPoints: number; feedback: string }>>;
  recommendCourses(
    input: { profile: Record<string, unknown>; catalog: { id: string; title: string; tags: string[] }[] },
    ctx: AIContext,
  ): Promise<AIResult<{ courseId: string; reason: string }[]>>;
}
