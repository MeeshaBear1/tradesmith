/**
 * Homeowner financing behind a swappable provider seam.
 *
 * Today the only provider is a deterministic, clearly-illustrative MOCK (no lender,
 * no KYC, zero capital risk). The point of the seam is Tier 2: when a real partner
 * (Wisetack / Sunlight / Hearth-style) is signed, implement `LenderProvider` once and
 * `getLender()` swaps it in — every call site (quote teaser, apply flow) is unchanged.
 * Real lending is the only place in this product with real margin (payments net <1%).
 */

export interface FinancingOption {
  termMonths: number;
  apr: number;
  monthlyPaymentCents: number;
  label: string;
}

export interface LenderProvider {
  /** Display name + whether this is a real, capital-backed lender. */
  name: string;
  live: boolean;
  /** Illustrative or real monthly options for an amount. */
  quote(amountCents: number): FinancingOption[];
  /** A soft pre-decision (the mock is deterministic; a real partner calls out). */
  prequalify(amountCents: number): "approved" | "declined";
}

function monthlyPaymentCents(principalCents: number, aprPct: number, months: number): number {
  const r = aprPct / 100 / 12;
  if (r === 0) return Math.round(principalCents / months);
  return Math.round((principalCents * r) / (1 - Math.pow(1 + r, -months)));
}

const MOCK_TERMS: { months: number; apr: number; label: string }[] = [
  { months: 12, apr: 0, label: "12 mo — same as cash" },
  { months: 60, apr: 9.99, label: "60 mo" },
  { months: 120, apr: 12.99, label: "120 mo" },
];

const APPROVAL_CEILING_CENTS = 5_000_000; // $50k mock underwriting ceiling

/** The illustrative, no-lender provider. Clearly labeled in the UI as illustrative. */
export const MockLender: LenderProvider = {
  name: "Illustrative (no lender)",
  live: false,
  quote(amountCents: number): FinancingOption[] {
    return MOCK_TERMS.map((t) => ({
      termMonths: t.months,
      apr: t.apr,
      label: t.label,
      monthlyPaymentCents: monthlyPaymentCents(amountCents, t.apr, t.months),
    }));
  },
  prequalify(amountCents: number): "approved" | "declined" {
    return amountCents > 0 && amountCents < APPROVAL_CEILING_CENTS ? "approved" : "declined";
  },
};

/**
 * Select the active lender. Today: always the mock. When a partner is integrated,
 * gate a real `LenderProvider` here on its API key (e.g. `hasKey("financing")`) and
 * return it; nothing else changes. See docs/TIER2_MOAT.md.
 */
export function getLender(): LenderProvider {
  return MockLender;
}

// ---- Back-compat surface (existing call sites keep working) ----

export function financingOptions(amountCents: number): FinancingOption[] {
  return getLender().quote(amountCents);
}

export function financingDecision(amountCents: number): "approved" | "declined" {
  return getLender().prequalify(amountCents);
}
