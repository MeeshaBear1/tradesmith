/** Mocked homeowner financing — deterministic, clearly illustrative (no real lender). */

export interface FinancingOption {
  termMonths: number;
  apr: number;
  monthlyPaymentCents: number;
  label: string;
}

const TERMS: { months: number; apr: number; label: string }[] = [
  { months: 12, apr: 0, label: "12 mo — same as cash" },
  { months: 60, apr: 9.99, label: "60 mo" },
  { months: 120, apr: 12.99, label: "120 mo" },
];

const APPROVAL_CEILING_CENTS = 5_000_000; // $50k mock underwriting ceiling

function monthlyPaymentCents(principalCents: number, aprPct: number, months: number): number {
  const r = aprPct / 100 / 12;
  if (r === 0) return Math.round(principalCents / months);
  return Math.round((principalCents * r) / (1 - Math.pow(1 + r, -months)));
}

export function financingOptions(amountCents: number): FinancingOption[] {
  return TERMS.map((t) => ({
    termMonths: t.months,
    apr: t.apr,
    label: t.label,
    monthlyPaymentCents: monthlyPaymentCents(amountCents, t.apr, t.months),
  }));
}

export function financingDecision(amountCents: number): "approved" | "declined" {
  return amountCents > 0 && amountCents < APPROVAL_CEILING_CENTS ? "approved" : "declined";
}
