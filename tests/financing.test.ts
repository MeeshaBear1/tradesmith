import { describe, it, expect } from "vitest";
import { getLender, MockLender, financingOptions, financingDecision } from "@/lib/financing";

describe("financing provider seam", () => {
  it("getLender returns the illustrative mock today, marked not-live", () => {
    expect(getLender()).toBe(MockLender);
    expect(getLender().live).toBe(false);
  });

  it("quotes three options incl. a 0% same-as-cash tier; longer terms lower the monthly", () => {
    const opts = financingOptions(1_000_000);
    expect(opts).toHaveLength(3);
    expect(opts[0].apr).toBe(0);
    expect(opts[0].monthlyPaymentCents).toBe(Math.round(1_000_000 / 12));
    expect(opts[1].monthlyPaymentCents).toBeLessThan(opts[0].monthlyPaymentCents);
    expect(opts[2].monthlyPaymentCents).toBeLessThan(opts[1].monthlyPaymentCents);
    for (const o of opts) expect(Number.isInteger(o.monthlyPaymentCents)).toBe(true);
  });

  it("prequalifies in-range amounts, declines zero and over-ceiling", () => {
    expect(financingDecision(1_000_000)).toBe("approved");
    expect(financingDecision(0)).toBe("declined");
    expect(financingDecision(6_000_000)).toBe("declined");
  });
});
