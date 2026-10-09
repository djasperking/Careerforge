import { describe, expect, it } from "vitest";
import { isGenericTitle, looksLikeSingleJob } from "@/lib/jobs/ingest/clip-guard";

const JOB_TEXT =
  "Senior Data Annotator. We are looking for a detail-oriented annotator to review AI model outputs. Responsibilities include rating " +
  "responses, writing rationales and flagging unsafe content. Requirements: strong English, 1+ year of experience in annotation or QA, " +
  "and excellent attention to detail. Skills in prompt evaluation are a plus. Compensation is paid per task. Apply now to join the team. ".repeat(2);

describe("looksLikeSingleJob", () => {
  it("accepts a page with structured JobPosting data, whatever the address", () => {
    expect(looksLikeSingleJob({ url: "https://x.com/jobs", text: "", hasStructuredData: true })).toBe(true);
  });

  it("accepts a real job page", () => {
    expect(looksLikeSingleJob({ url: "https://work.example.com/jobs/senior-data-annotator-123", text: JOB_TEXT, hasStructuredData: false })).toBe(true);
  });

  it.each([
    "https://work.turing.com/jobs",
    "https://refer.micro1.ai/opportunities",
    "https://www.linkedin.com/careers/",
    "https://example.com/explore",
    "https://example.com/",
  ])("rejects a list or landing address: %s", (url) => {
    expect(looksLikeSingleJob({ url, text: JOB_TEXT, hasStructuredData: false })).toBe(false);
  });

  it("rejects a marketing page that doesn't read like a job description", () => {
    const marketing = "Freelancer Plus with new perks. Get more connects, see client budgets and stand out with a profile boost. ".repeat(8);
    expect(looksLikeSingleJob({ url: "https://www.upwork.com/freelancer-plus-new-perks", text: marketing, hasStructuredData: false })).toBe(false);
  });

  it("rejects a page with too little text", () => {
    expect(looksLikeSingleJob({ url: "https://example.com/jobs/abc", text: "Apply now. Requirements. Skills.", hasStructuredData: false })).toBe(false);
  });
});

describe("isGenericTitle", () => {
  it.each(["Explore roles", "Opportunities", "Don't See A Perfect Role? Apply Anyway!", "Careers", "Open positions", "Jobs"])(
    "flags %s",
    (t) => expect(isGenericTitle(t)).toBe(true),
  );
  it.each(["Senior Data Annotator", "Web Research Task Author", "Jobs Analyst", "Careers Adviser, Lagos"])("allows %s", (t) =>
    expect(isGenericTitle(t)).toBe(false),
  );
});
