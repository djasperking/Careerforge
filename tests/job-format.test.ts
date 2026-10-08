import { describe, expect, it } from "vitest";
import { companyInitials, postedAgo, shortPay, isNewJob } from "@/lib/jobs/format";

describe("shortPay", () => {
  it("keeps short pay text as is", () => {
    expect(shortPay("$17/hr (USD)")).toBe("$17/hr (USD)");
    expect(shortPay("Up to ~$150–$160")).toBe("Up to ~$150–$160");
  });
  it("pulls the amount out of a long sentence", () => {
    expect(shortPay("Estimated earning potential of approximately $30 per approved task")).toBe("$30 per approved task");
    expect(shortPay("We offer a competitive range of $100–$150/hr depending on experience and domain")).toBe("$100–$150/hr");
  });
  it("shows nothing for a long text with no amount, rather than a chopped sentence", () => {
    expect(shortPay("Competitive salary and a generous benefits package for the right person")).toBeNull();
  });
  it("handles empty values", () => {
    expect(shortPay(null)).toBeNull();
    expect(shortPay("   ")).toBeNull();
  });
});

describe("postedAgo / isNewJob", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  it("formats relative dates", () => {
    expect(postedAgo(new Date("2026-10-10T08:00:00Z"), now)).toBe("Today");
    expect(postedAgo(new Date("2026-10-09T08:00:00Z"), now)).toBe("Yesterday");
    expect(postedAgo(new Date("2026-10-07T08:00:00Z"), now)).toBe("3d ago");
    expect(postedAgo(new Date("2026-09-26T08:00:00Z"), now)).toBe("2w ago");
  });
  it("flags jobs under 3 days old as new", () => {
    expect(isNewJob(new Date("2026-10-09T12:00:00Z"), now)).toBe(true);
    expect(isNewJob(new Date("2026-10-01T12:00:00Z"), now)).toBe(false);
  });
});

describe("companyInitials", () => {
  it("makes sensible initials", () => {
    expect(companyInitials("Lemon.io")).toBe("L");
    expect(companyInitials("Scale AI")).toBe("SA");
    expect(companyInitials("")).toBe("•");
  });
});
