import { describe, expect, it } from "vitest";
import { mockPaymentProvider } from "@/lib/payments/mock";

describe("mock payment provider", () => {
  it("builds a local checkout URL carrying the reference and callback", async () => {
    const result = await mockPaymentProvider.initCheckout({
      reference: "course_abc123_xyz",
      email: "demo@careerforge.local",
      amountCents: 500_000,
      currency: "NGN",
      callbackUrl: "http://localhost:3000/dashboard/payments/callback",
    });
    expect(result.authorizationUrl).toContain("/checkout/mock");
    expect(result.authorizationUrl).toContain("reference=course_abc123_xyz");
  });

  it("always verifies as SUCCESS (it's a mock, not a real gateway)", async () => {
    const result = await mockPaymentProvider.verify("course_abc123_xyz");
    expect(result.status).toBe("SUCCESS");
    expect(result.providerRef).toBe("course_abc123_xyz");
  });

  it("parses its own webhook payload shape", () => {
    const body = JSON.stringify({ event: "charge.success", data: { reference: "course_abc123_xyz" } });
    const parsed = mockPaymentProvider.parseWebhook(body, null);
    expect(parsed.eventType).toBe("charge.success");
    expect(parsed.reference).toBe("course_abc123_xyz");
    expect(parsed.eventId).toBe("charge.success:course_abc123_xyz");
  });
});
