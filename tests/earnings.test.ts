import { describe, it, expect } from "vitest";
import { splitEarning } from "@/lib/earnings/service";

describe("splitEarning", () => {
  it("splits a clean 70/30", () => {
    expect(splitEarning(10_000, 70)).toEqual({ netCents: 7_000, feeCents: 3_000 });
  });

  it("never loses or invents a kobo (net + fee === gross)", () => {
    for (const gross of [1, 99, 507, 12_345, 999_999]) {
      for (const share of [0, 30, 55, 70, 80, 100]) {
        const { netCents, feeCents } = splitEarning(gross, share);
        expect(netCents + feeCents).toBe(gross);
        expect(netCents).toBeGreaterThanOrEqual(0);
        expect(feeCents).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("clamps out-of-range shares", () => {
    expect(splitEarning(1_000, 250).netCents).toBe(1_000);
    expect(splitEarning(1_000, -10).netCents).toBe(0);
  });
});
