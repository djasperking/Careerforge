import { describe, expect, it } from "vitest";
import { heuristicCourseParse } from "@/lib/course/parse-document";
import { coerceCourseImport, countImportLessons } from "@/lib/course/import";

const SYLLABUS = `Data Analytics for Business Decisions

A practical 8-week course covering spreadsheets, SQL, dashboards and storytelling with data for working professionals.

Learning objectives
- Clean and model messy data
- Write intermediate SQL
- Present findings to non-technical audiences

Module 1: Foundations of Working with Data
- What analytics is (and isn't)
Analytics is examining data to answer a question and drive a decision. It is not reporting for its own sake.
- Spreadsheets: formulas and pivots
- Module 1 quiz

Module 2: Querying Data with SQL
- SELECT, WHERE, ORDER BY
- Joins and grouping
- Assignment: answer 5 business questions in SQL
`;

describe("heuristicCourseParse", () => {
  const out = heuristicCourseParse(SYLLABUS);

  it("pulls the title and description", () => {
    expect(out.title).toBe("Data Analytics for Business Decisions");
    expect(out.description.toLowerCase()).toContain("8-week");
  });

  it("captures objectives", () => {
    expect(out.objectives).toEqual(expect.arrayContaining(["Write intermediate SQL"]));
  });

  it("splits modules and lessons and tags types", () => {
    expect(out.modules.length).toBe(2);
    expect(out.modules[0].title).toBe("Foundations of Working with Data");
    const quiz = out.modules[0].lessons.find((l) => /quiz/i.test(l.title));
    expect(quiz?.type).toBe("QUIZ");
    const assignment = out.modules[1].lessons.find((l) => /assignment/i.test(l.title));
    expect(assignment?.type).toBe("ASSIGNMENT");
  });

  it("attaches body text only where the document had it", () => {
    const intro = out.modules[0].lessons[0];
    expect(intro.content).toContain("answer a question");
    expect(out.modules[1].lessons[0].content).toBe("");
  });

  it("never throws on junk", () => {
    expect(() => heuristicCourseParse("")).not.toThrow();
    expect(() => heuristicCourseParse("...")).not.toThrow();
  });
});

describe("coerceCourseImport", () => {
  it("repairs a loose shape and guarantees a module", () => {
    const out = coerceCourseImport({ title: "X", modules: [{ title: "M", lessons: [] }] });
    expect(out.modules[0].lessons.length).toBeGreaterThan(0);
    expect(out.level).toBe("BEGINNER");
  });

  it("falls back to a default module when none are given", () => {
    const out = coerceCourseImport({ title: "Solo" });
    expect(out.modules.length).toBe(1);
    expect(countImportLessons(out)).toBe(1);
  });

  it("clamps bad lesson types to TEXT", () => {
    const out = coerceCourseImport({
      modules: [{ title: "M", lessons: [{ title: "L", type: "PODCAST", content: "" }] }],
    });
    expect(out.modules[0].lessons[0].type).toBe("TEXT");
  });
});
