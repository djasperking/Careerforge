import { describe, expect, it } from "vitest";
import { scoreJob, rankMatches } from "@/lib/jobs/matching";

const kw = (...w: string[]) => new Set(w);

const job = (over: Partial<Parameters<typeof scoreJob>[1]> = {}) => ({
  id: "j1",
  slug: "j1",
  title: "Data Annotator",
  company: "Acme",
  category: "AI",
  description: "We need someone with python and labelling experience for image data.",
  salaryText: null,
  ...over,
});

describe("job matching", () => {
  it("scores keyword overlap, weighting the title", () => {
    const m = scoreJob(kw("annotator", "python", "labelling"), job());
    // annotator is in the title (counts double) + python + labelling in body
    expect(m.score).toBeGreaterThanOrEqual(4);
    expect(m.hits).toEqual(expect.arrayContaining(["python", "labelling"]));
  });

  it("returns zero when the user has no keywords", () => {
    expect(scoreJob(new Set(), job()).score).toBe(0);
  });

  it("rankMatches drops weak matches and sorts by score", () => {
    const jobs = [
      job({ id: "a", title: "Data Annotator", description: "python labelling image data" }),
      job({ id: "b", title: "Chef", description: "cooking in a kitchen" }),
      job({ id: "c", title: "Python Developer", description: "backend python api work" }),
    ];
    const ranked = rankMatches(kw("annotator", "python", "labelling", "image"), jobs);
    expect(ranked.map((r) => r.id)).not.toContain("b");
    expect(ranked[0].id).toBe("a");
  });
});
