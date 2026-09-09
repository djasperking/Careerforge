import { describe, expect, it } from "vitest";
import { heuristicParseJob } from "@/lib/jobs/parse-posting";

const POSTING = `Senior Data Annotator at Scale AI

Location: Remote (Nigeria friendly)
Employment type: Full-time
Salary: $1,000 - $1,500 / month

About the role
You will label and quality-check training data for large language models.

Requirements
- 1+ year of annotation experience
- Strong attention to detail
`;

describe("heuristicParseJob", () => {
  const j = heuristicParseJob(POSTING);

  it("pulls the title and company from the first line", () => {
    expect(j.title).toBe("Senior Data Annotator");
    expect(j.company).toBe("Scale AI");
  });

  it("reads location, type and salary", () => {
    expect(j.locationType).toBe("REMOTE");
    expect(j.type).toBe("FULL_TIME");
    expect(j.salaryText).toMatch(/\$1,000/);
  });

  it("keeps the full body as the description", () => {
    expect(j.description).toContain("quality-check training data");
    expect(j.description).toContain("attention to detail");
  });

  it("never throws on junk", () => {
    expect(() => heuristicParseJob("")).not.toThrow();
    expect(() => heuristicParseJob("hello world")).not.toThrow();
    expect(heuristicParseJob("hello world").type).toBe("FULL_TIME");
  });
});
