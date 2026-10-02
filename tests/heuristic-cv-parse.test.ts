import { describe, expect, it } from "vitest";
import { heuristicParseCv } from "@/lib/cv/heuristic-parse";

const SAMPLE = `Jane Doe
Senior Data Analyst
jane.doe@example.com | +234 801 234 5678 | linkedin.com/in/janedoe

SUMMARY
Data analyst with 6 years turning messy data into decisions.

SKILLS
SQL, Python, Power BI, dbt, stakeholder management

EXPERIENCE
Lead Analyst at Paystack   Jan 2021 - Present
- Built the company-wide revenue dashboard
- Mentored 3 junior analysts

Analyst at Andela   Mar 2018 - Dec 2020
- Owned weekly reporting for the talent team

EDUCATION
University of Lagos
BSc Computer Science   2013 - 2017
`;

type ParsedCv = {
  personalInfo?: { fullName?: string; email?: string; phone?: string; linkedin?: string };
  professionalSummary?: string;
  skills?: string[];
  experience?: { company?: string; title?: string; current?: boolean; bullets?: string[] }[];
  education?: { institution?: string }[];
};

describe("heuristicParseCv", () => {
  const cv = heuristicParseCv(SAMPLE) as ParsedCv;

  it("pulls contact details", () => {
    expect(cv.personalInfo?.fullName).toBe("Jane Doe");
    expect(cv.personalInfo?.email).toBe("jane.doe@example.com");
    expect(cv.personalInfo?.phone).toContain("801 234 5678");
    expect(cv.personalInfo?.linkedin).toContain("linkedin.com/in/janedoe");
  });

  it("captures the summary and skills", () => {
    expect(cv.professionalSummary).toContain("6 years");
    expect(cv.skills).toEqual(expect.arrayContaining(["SQL", "Python", "Power BI"]));
  });

  it("splits experience into entries with bullets", () => {
    expect(cv.experience?.length).toBe(2);
    const lead = cv.experience?.[0];
    expect(`${lead?.company} ${lead?.title}`).toContain("Paystack");
    expect(lead?.current).toBe(true);
    expect(lead?.bullets?.length).toBeGreaterThan(0);
  });

  it("captures education", () => {
    expect(cv.education?.[0]?.institution).toContain("Lagos");
  });

  it("never throws on junk input", () => {
    expect(() => heuristicParseCv("")).not.toThrow();
    expect(() => heuristicParseCv("...")).not.toThrow();
  });
});

describe("heuristicParseCv on a PDF-style CV with no name line", () => {
  const TEXT = `improving financial efficiency.
• General Ledger Maintenance & Reconciliation
glory@example.com | 778.325.9367 | linkedin.com/in/glory-adeyemi-b5b73a196

WORK EXPERIENCE
STAFF ACCOUNTANT, Parihar & Associates, Langley 02/2025 · Present
• Performed general ledger and bank reconciliations and assisted with accounts receivable transactions to support
accurate monthly reporting.
FINANCIAL ACCOUNTANT, FinaTrust Microfinance Bank, Lagos 07/2022 – 06/2023
• Completed monthly bank reconciliations using Cleric
software.
`;
  const cv = heuristicParseCv(TEXT) as ParsedCv;

  it("does not mistake a stray sentence for the name", () => {
    expect(cv.personalInfo?.fullName).toBe("Glory Adeyemi");
  });

  it("splits jobs, reads MM/YYYY dates and rejoins wrapped bullets", () => {
    expect(cv.experience).toHaveLength(2);
    expect(cv.experience?.[0]).toMatchObject({ title: "STAFF ACCOUNTANT", company: "Parihar & Associates", current: true });
    expect(cv.experience?.[0].bullets).toHaveLength(1);
    expect(cv.experience?.[0].bullets?.[0]).toContain("support accurate monthly reporting.");
    expect(cv.experience?.[1].company).toBe("FinaTrust Microfinance Bank");
  });
});
