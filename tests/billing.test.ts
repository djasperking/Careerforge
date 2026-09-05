import { describe, expect, it } from "vitest";
import { subscriptionPeriodDays } from "@/lib/billing/service";

describe("subscriptionPeriodDays", () => {
  it("gives 30 days for monthly plans", () => {
    expect(subscriptionPeriodDays("monthly")).toBe(30);
  });

  it("gives 365 days for yearly plans", () => {
    expect(subscriptionPeriodDays("yearly")).toBe(365);
  });

  it("falls back to a long lifetime period for anything else", () => {
    expect(subscriptionPeriodDays("none")).toBeGreaterThan(365 * 50);
    expect(subscriptionPeriodDays("unexpected")).toBeGreaterThan(365 * 50);
  });
});
