import { describe, expect, it } from "vitest";
import { emptyCvContent, type CVContent } from "@/lib/cv/schema";
import { applyCondense, condenseLadder } from "@/lib/cv/condense";

function sampleCv(): CVContent {
  const c = emptyCvContent();
  c.personalInfo.fullName = "Ada Lovelace";
  c.professionalSummary = "x".repeat(600);
  c.skills = ["SQL", "Python"];
  c.references = [
    { id: "r1", name: "Referee", relationship: "Manager", contact: "ref@x.com" },
  ];
  c.languages = [{ id: "l1", name: "English", proficiency: "Native" }];
  c.experience = Array.from({ length: 6 }, (_, i) => ({
    id: `e${i}`,
    company: `Co ${i}`,
    title: "Analyst",
    location: "",
    startDate: "2020",
    endDate: "2021",
    current: false,
    bullets: ["a", "b", "c", "d", "e", "f"],
  }));
  return c;
}

describe("cv condense ladder", () => {
  it("does nothing at step 0", () => {
    const cv = sampleCv();
    const { content, notes } = applyCondense(cv, 0);
    expect(notes).toEqual([]);
    expect(content.references.length).toBe(1);
    expect(content.experience.length).toBe(6);
  });

  it("drops optional sections and trims experience as steps increase", () => {
    const cv = sampleCv();
    const full = applyCondense(cv, condenseLadder().length);
    expect(full.content.references).toEqual([]);
    expect(full.content.languages).toEqual([]);
    expect(full.content.experience.length).toBeLessThanOrEqual(4);
    expect(full.content.experience[1]?.bullets.length).toBeLessThanOrEqual(3);
    expect(full.content.professionalSummary.length).toBeLessThan(600);
    expect(full.notes.length).toBeGreaterThan(3);
  });

  it("never mutates the input", () => {
    const cv = sampleCv();
    applyCondense(cv, 99);
    expect(cv.references.length).toBe(1);
    expect(cv.experience.length).toBe(6);
  });

  it("clamps lengthTarget through the schema", () => {
    const c = emptyCvContent();
    expect(c.lengthTarget).toBe(0);
  });
});
