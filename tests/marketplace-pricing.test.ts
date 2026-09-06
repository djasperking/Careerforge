import { describe, expect, it } from "vitest";
import { discountIsActive, effectivePriceCents } from "@/lib/instructor/service";
import { minorToMajor, majorToMinor } from "@/lib/utils";

const base = { priceCents: 10_000, discountPercent: null as number | null, discountEndsAt: null as Date | null };

describe("effectivePriceCents", () => {
  it("returns the full price when there is no discount", () => {
    expect(effectivePriceCents(base)).toBe(10_000);
    expect(discountIsActive(base)).toBe(false);
  });

  it("applies an active percentage discount", () => {
    const d = { ...base, discountPercent: 25 };
    expect(discountIsActive(d)).toBe(true);
    expect(effectivePriceCents(d)).toBe(7_500);
  });

  it("ignores a discount whose end date has passed", () => {
    const d = { ...base, discountPercent: 50, discountEndsAt: new Date(Date.now() - 86_400_000) };
    expect(discountIsActive(d)).toBe(false);
    expect(effectivePriceCents(d)).toBe(10_000);
  });

  it("honours a discount that has not yet expired", () => {
    const d = { ...base, discountPercent: 10, discountEndsAt: new Date(Date.now() + 86_400_000) };
    expect(effectivePriceCents(d)).toBe(9_000);
  });
});

describe("naira <-> minor units", () => {
  it("round-trips a whole-naira amount", () => {
    expect(majorToMinor(minorToMajor(800_000))).toBe(800_000);
  });

  it("converts naira to kobo", () => {
    expect(majorToMinor(1000)).toBe(100_000);
    expect(minorToMajor(100_000)).toBe(1000);
  });

  it("treats a blank amount as zero", () => {
    expect(majorToMinor(NaN)).toBe(0);
  });
});
