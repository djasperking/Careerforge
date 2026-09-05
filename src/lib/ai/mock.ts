import type {
  AIProvider,
  AIResult,
  CVAnalysisOutput,
  GeneratedQuestion,
  QuestionGenInput,
} from "./types";

function wrap<T>(data: T): AIResult<T> {
  return {
    data,
    meta: {
      provider: "mock",
      model: "mock-1",
      promptTokens: 0,
      outputTokens: 0,
      latencyMs: 5,
      isAIGenerated: true,
    },
  };
}

/**
 * Deterministic mock provider. Lets the whole platform run — and tests pass —
 * without an API key. It never fabricates credentials: it only rephrases or
 * flags fields for verification.
 */
export const mockAIProvider: AIProvider = {
  name: "mock",

  async generateCV(input) {
    return wrap({
      ...input.rawProfile,
      professionalSummary:
        "Results-oriented professional with demonstrated experience. [AI draft — review and confirm details.]",
      _aiGenerated: true,
    });
  },

  async analyzeCV(input) {
    const jd = input.jobDescription.toLowerCase();
    const missing = ["stakeholder management", "kpi ownership"].filter(
      (k) => !JSON.stringify(input.cv).toLowerCase().includes(k),
    );
    const out: CVAnalysisOutput = {
      matchScore: 62,
      missingKeywords: missing,
      missingSkills: jd.includes("sql") ? ["SQL"] : [],
      weakSections: ["professionalSummary", "achievements"],
      suggestions: [
        { section: "professionalSummary", suggestion: "Quantify impact with metrics.", requiresVerification: false },
        { section: "experience", suggestion: "Lead each bullet with an action verb.", requiresVerification: false },
      ],
      atsRecommendations: ["Use a single-column layout", "Avoid tables and text boxes"],
      improvedSummary:
        "Professional with a track record of measurable results. [AI draft — verify specifics.]",
    };
    return wrap(out);
  },

  async generateCoverLetter(input) {
    return wrap({
      coverLetter:
        "Dear Hiring Manager,\n\nI am writing to express my interest... [AI draft — personalise before sending.]\n\nSincerely,",
    });
  },

  async careerAdvice(input) {
    return wrap({
      reply: `Here are some considerations for "${input.question}": clarify your target role, identify the top 3 skill gaps, and pick one course to close the most important gap this quarter. [AI-generated guidance.]`,
    });
  },

  async generateCourseOutline(input) {
    return wrap({
      modules: [
        { title: `Introduction to ${input.title}`, lessons: ["Overview", "Key concepts", "Setup"] },
        { title: "Core skills", lessons: ["Fundamentals", "Hands-on practice", "Common pitfalls"] },
        { title: "Applying it", lessons: ["Case study", "Project", "Next steps"] },
      ],
    });
  },

  async generateQuestions(input: QuestionGenInput) {
    const questions: GeneratedQuestion[] = Array.from({ length: input.count }, (_, i) => ({
      prompt: `(${input.topic}) Sample ${input.difficulty} question ${i + 1}?`,
      options: [
        { text: "Correct option", isCorrect: true },
        { text: "Distractor A", isCorrect: false },
        { text: "Distractor B", isCorrect: false },
        { text: "Distractor C", isCorrect: false },
      ],
      correctAnswerText: input.type === "SHORT_ANSWER" ? "expected answer" : undefined,
      explanation: "The correct option is correct because it matches the definition.",
      difficulty: input.difficulty,
      topic: input.topic,
    }));
    return wrap(questions);
  },

  async gradeAnswer(input) {
    const hit = input.answer.trim().length > 20;
    return wrap({
      awardedPoints: hit ? Math.round(input.maxPoints * 0.8) : Math.round(input.maxPoints * 0.3),
      feedback: hit ? "Good coverage; add a concrete example." : "Answer is too brief; expand your reasoning.",
    });
  },

  async recommendCourses(input) {
    return wrap(input.catalog.slice(0, 3).map((c) => ({ courseId: c.id, reason: "Matches your stated interests." })));
  },
};
