import { describe, it, expect } from "vitest";
import { isValidEmail, normalizeEmail } from "@/lib/marketplace/guest";

describe("guest checkout email handling", () => {
  it("normalises case and whitespace", () => {
    expect(normalizeEmail("  Buyer@Example.COM ")).toBe("buyer@example.com");
  });

  it("accepts a plausible address", () => {
    expect(isValidEmail("jane.doe+tag@sub.example.co")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    for (const bad of ["", "no-at", "a@b", "a b@c.com", "@example.com", "x@y."]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
});
