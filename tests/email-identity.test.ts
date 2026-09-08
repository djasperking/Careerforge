import { describe, expect, it } from "vitest";
import { canonicalEmail, isAliasedEmail } from "@/lib/email-identity";

describe("canonicalEmail", () => {
  it("strips a +tag on any domain", () => {
    expect(canonicalEmail("shaheestanleyy+cfseller@gmail.com")).toBe("shaheestanleyy@gmail.com");
    expect(canonicalEmail("jane+news@outlook.com")).toBe("jane@outlook.com");
    expect(canonicalEmail("ops+ci@careerforge.com.ng")).toBe("ops@careerforge.com.ng");
  });

  it("removes dots only for Gmail and folds googlemail.com", () => {
    expect(canonicalEmail("j.o.h.n.smith@gmail.com")).toBe("johnsmith@gmail.com");
    expect(canonicalEmail("john.smith@googlemail.com")).toBe("johnsmith@gmail.com");
    expect(canonicalEmail("john.smith@fastmail.com")).toBe("john.smith@fastmail.com");
  });

  it("lowercases and trims", () => {
    expect(canonicalEmail("  Foo.Bar+X@Gmail.com ")).toBe("foobar@gmail.com");
  });

  it("leaves a plain address unchanged and flags aliases", () => {
    expect(canonicalEmail("plain@example.com")).toBe("plain@example.com");
    expect(isAliasedEmail("plain@example.com")).toBe(false);
    expect(isAliasedEmail("plain+x@example.com")).toBe(true);
    expect(isAliasedEmail("pl.ain@gmail.com")).toBe(true);
  });
});
