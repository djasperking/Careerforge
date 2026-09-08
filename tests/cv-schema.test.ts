import { describe, expect, it } from "vitest";
import {
  emptyCvContent, parseCvContent, scoreCvCompleteness, parseTemplateConfig,
  normalizeSkills, coerceCvContent,
} from "@/lib/cv/schema";

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
    expect(cfg.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(cfg.headerAlign).toBe("center");
    expect(cfg.headingStyle).toBe("underline");
    expect(parseTemplateConfig({ columns: 2 }).columns).toBe(2);
  });

  it("keeps a valid custom template style and rejects a bad accent", () => {
    const cfg = parseTemplateConfig({ accent: "#be185d", headerAlign: "left", headingStyle: "bar", uppercaseHeadings: false });
    expect(cfg.accent).toBe("#be185d");
    expect(cfg.headerAlign).toBe("left");
    expect(cfg.headingStyle).toBe("bar");
    expect(cfg.uppercaseHeadings).toBe(false);
    expect(parseTemplateConfig({ accent: "red" }).accent).toBe("#404040");
  });
});

describe("normalizeSkills", () => {
  it("splits, trims and de-duplicates a messy blob", () => {
    const out = normalizeSkills("SQL, Python; Python •  Power BI | data-viz\nSQL");
    expect(out).toEqual(["SQL", "Python", "Power BI", "data-viz"]);
  });

  it("drops sentence-length noise and caps the list", () => {
    const out = normalizeSkills([
      "Excellent communicator who thrives in fast paced cross functional teams delivering value",
      "Java", "Go", "Rust", "C++", "Kotlin", "Scala", "Elixir", "Haskell", "Perl", "Ruby",
      "PHP", "Swift", "Dart", "Zig", "Nim",
    ]);
    expect(out).not.toContain(
      "Excellent communicator who thrives in fast paced cross functional teams delivering value",
    );
    expect(out.length).toBeLessThanOrEqual(14);
  });

  it("is applied by coerceCvContent", () => {
    const c = coerceCvContent({ skills: ["A", "a", " A ", "B,C"] });
    expect(c.skills).toEqual(["A", "B", "C"]);
  });
});
