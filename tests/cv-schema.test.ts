import { describe, expect, it } from "vitest";
import { emptyCvContent, parseCvContent, scoreCvCompleteness, parseTemplateConfig } from "@/lib/cv/schema";

describe("cv schema", () => {
  it("produces a fully-defaulted empty document", () => {
    const c = emptyCvContent();
    expect(c.experience).toEqual([]);
    expect(c.personalInfo.fullName).toBe("");
  });

  it("recovers from garbage/legacy JSON instead of throwing", () => {
    expect(parseCvContent(null)).toEqual(emptyCvContent());
    expect(parseCvContent({ random: "junk" })).toEqual(emptyCvContent());
  });

  it("scores completeness based on filled sections", () => {
    const empty = emptyCvContent();
    expect(scoreCvCompleteness(empty)).toBe(0);

    const filled = {
      ...empty,
      personalInfo: { ...empty.personalInfo, fullName: "Ada Lovelace", email: "ada@example.com" },
      professionalSummary: "Engineer.",
      experience: [{ id: "1", company: "", title: "", location: "", startDate: "", endDate: "", current: false, bullets: [] }],
      education: [{ id: "1", institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" }],
      skills: ["SQL"],
    };
    expect(scoreCvCompleteness(filled)).toBe(100);
  });

  it("falls back to sane template defaults", () => {
    const cfg = parseTemplateConfig(undefined);
    expect(cfg.columns).toBe(1);
    expect(cfg.sectionOrder.length).toBeGreaterThan(0);
    expect(parseTemplateConfig({ columns: 2 }).columns).toBe(2);
  });
});
