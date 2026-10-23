import { describe, expect, it } from "vitest";
import { salaryToSchema } from "@/lib/jobs/salary";

describe("salaryToSchema", () => {
  it("reads a dollar hourly range", () => {
    expect(salaryToSchema("$20 – $22 per hour")?.value).toEqual({ "@type": "QuantitativeValue", minValue: 20, maxValue: 22, unitText: "HOUR" });
    // No pay period written: a small amount is read as an hourly rate.
    expect(salaryToSchema("$20 – $22")?.value.unitText).toBe("HOUR");
    expect(salaryToSchema("$80,000")).toBeNull(); // large and no period: nothing is guessed
  });
  it("reads currency codes, k amounts and monthly pay", () => {
    expect(salaryToSchema("USD 50k-70k / year")).toMatchObject({ currency: "USD", value: { minValue: 50000, maxValue: 70000, unitText: "YEAR" } });
    expect(salaryToSchema("₦300,000 monthly")).toMatchObject({ currency: "NGN", value: { minValue: 300000, unitText: "MONTH" } });
  });
  it("returns null when it cannot be sure", () => {
    expect(salaryToSchema("Competitive")).toBeNull();
    expect(salaryToSchema("")).toBeNull();
    expect(salaryToSchema(null)).toBeNull();
    expect(salaryToSchema("50,000 per month")).toBeNull(); // no currency
  });
});
