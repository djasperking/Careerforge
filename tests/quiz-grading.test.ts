import { describe, expect, it } from "vitest";
import { gradeResponses } from "@/lib/course/quiz";

const questions = [
  { id: "q1", points: 1, explanation: null, options: [{ id: "a", isCorrect: true }, { id: "b", isCorrect: false }] },
  {
    id: "q2",
    points: 2,
    explanation: "because",
    options: [
      { id: "c", isCorrect: true },
      { id: "d", isCorrect: true },
      { id: "e", isCorrect: false },
    ],
  },
];

describe("gradeResponses", () => {
  it("scores an all-correct submission as 100 and passes", () => {
    const r = gradeResponses(questions, { q1: ["a"], q2: ["c", "d"] }, 70);
    expect(r.scorePercent).toBe(100);
    expect(r.passed).toBe(true);
  });

  it("requires an exact set match for multiple-answer questions", () => {
    const r = gradeResponses(questions, { q1: ["a"], q2: ["c"] }, 70);
    // q1 (1pt) correct, q2 (2pt) partial => 1/3 => 33
    expect(r.scorePercent).toBe(33);
    expect(r.passed).toBe(false);
    expect(r.perQuestion.find((p) => p.questionId === "q2")?.correct).toBe(false);
  });

  it("ignores option ids that don't belong to the question", () => {
    const r = gradeResponses(questions, { q1: ["a", "zzz"], q2: ["c", "d"] }, 70);
    expect(r.cleanAnswers.q1).toEqual(["a"]);
    expect(r.scorePercent).toBe(100);
  });

  it("treats no answer as wrong", () => {
    const r = gradeResponses(questions, {}, 50);
    expect(r.scorePercent).toBe(0);
    expect(r.passed).toBe(false);
  });
});
