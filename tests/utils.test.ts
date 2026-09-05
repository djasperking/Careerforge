import { describe, expect, it } from "vitest";
import { formatCurrency, generateCertificateId, slugify } from "@/lib/utils";

describe("utils", () => {
  it("formats currency from minor units", () => {
    expect(formatCurrency(350_000, "NGN")).toContain("3,500");
  });

  it("generates a CF-prefixed certificate id", () => {
    const id = generateCertificateId();
    expect(id).toMatch(/^CF-[A-Z2-9]{6}$/);
  });

  it("slugifies titles", () => {
    expect(slugify("CV Writing: Fundamentals!")).toBe("cv-writing-fundamentals");
  });
});
