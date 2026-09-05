import { describe, expect, it } from "vitest";
import { deterministicShuffle } from "@/lib/exam/service";

describe("deterministicShuffle", () => {
  it("is stable for the same seed", () => {
    const items = ["a", "b", "c", "d", "e"];
    const first = deterministicShuffle(items, "attempt-1:question-1");
    const second = deterministicShuffle(items, "attempt-1:question-1");
    expect(second).toEqual(first);
  });

  it("differs across seeds (with overwhelming probability)", () => {
    const items = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const a = deterministicShuffle(items, "attempt-1:question-1");
    const b = deterministicShuffle(items, "attempt-2:question-1");
    expect(a).not.toEqual(b);
  });

  it("never drops or duplicates items", () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = deterministicShuffle(items, "seed");
    expect([...shuffled].sort()).toEqual(items);
  });
});
