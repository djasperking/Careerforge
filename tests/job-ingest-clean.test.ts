import { describe, expect, it } from "vitest";
import { firstContentLine, isChromeLine, stripPageChrome, structureJobDescription } from "@/lib/jobs/ingest/clean";

const CLIP = `Employers
Jobseekers
Partners
About Us
Contact Us
Customer Support Representative

Remote

$20 – $22 per hour

Apply now

Customer Support Representative

This is a contract opportunity.

This is a remote opportunity.

About this position

Ready to be the friendly voice customers remember? We're looking for a Customer Support Representative who enjoys solving problems.

Job Responsibilities

Respond to customer questions through phone, email, chat, and support tickets with speed and care.
Troubleshoot account, product, or service issues and know when to bring in the right team for support.
Document customer conversations, issues, and resolutions accurately in the support system.

Skills/Requirements

Excellent written English
Experience with chat and email support
`;

describe("clip text cleaning", () => {
  it("recognises site menu and button text", () => {
    for (const l of ["Employers", "Jobseekers", "Partners", "About Us", "Contact Us", "Apply now"]) expect(isChromeLine(l)).toBe(true);
    expect(isChromeLine("Customer Support Representative")).toBe(false);
  });

  it("finds the real title once the menu is gone", () => {
    expect(firstContentLine(CLIP)).toBe("Customer Support Representative");
    expect(stripPageChrome(CLIP).startsWith("Customer Support Representative")).toBe(true);
  });

  it("builds a tidy description from a messy clip", () => {
    const out = structureJobDescription(CLIP, { title: "Customer Support Representative", salaryText: "$20 – $22" });
    expect(out).not.toMatch(/Employers|Jobseekers|Partners|Contact Us|Apply now/);
    expect(out).not.toMatch(/^\$20/m);
    expect(out).not.toMatch(/This is a (contract|remote) opportunity/);
    expect(out.startsWith("## About this position")).toBe(true);
    expect(out).toContain("## Job Responsibilities");
    expect(out).toContain("## Skills/Requirements");
    expect(out).toContain("- Respond to customer questions through phone");
    expect(out).toContain("- Experience with chat and email support");
    // The intro paragraph stays a paragraph, not a bullet.
    expect(out).toMatch(/\nReady to be the friendly voice[^\n]+\n/);
    expect(out).not.toMatch(/- Ready to be/);
  });

  it("is stable when run twice", () => {
    const once = structureJobDescription(CLIP, { title: "Customer Support Representative", salaryText: "$20 – $22" });
    expect(structureJobDescription(once, { title: "Customer Support Representative", salaryText: "$20 – $22" })).toBe(once);
  });

  it("leaves a normal paragraph description readable", () => {
    const out = structureJobDescription("We hire writers.\n\nYou will write articles every week.");
    expect(out).toBe("We hire writers.\n\nYou will write articles every week.");
  });
});
