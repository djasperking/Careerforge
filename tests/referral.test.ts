import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import { creditToApply } from "@/lib/referral/service";
import * as db from "@/lib/db";

describe("creditToApply", () => {
  it("caps credit at the price and at the balance", async () => {
    // @ts-expect-error test stub
    db.db.user = { findUnique: async () => ({ creditCents: 30000 }) };
    expect(await creditToApply("u", 100000)).toBe(30000); // balance-limited
    expect(await creditToApply("u", 20000)).toBe(20000); // price-limited
    expect(await creditToApply("u", 0)).toBe(0);
  });
  it("handles no balance", async () => {
    // @ts-expect-error test stub
    db.db.user = { findUnique: async () => null };
    expect(await creditToApply("u", 50000)).toBe(0);
  });
});
