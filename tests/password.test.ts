import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, passwordIssues } from "@/lib/password";

describe("password", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("Correct-Horse-9");
    expect(hash).not.toContain("Correct-Horse-9");
    expect(await verifyPassword("Correct-Horse-9", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("flags weak passwords", () => {
    expect(passwordIssues("short")).not.toHaveLength(0);
    expect(passwordIssues("alllowercase123")).toContain("an uppercase letter");
    expect(passwordIssues("StrongPass123")).toHaveLength(0);
  });
});
