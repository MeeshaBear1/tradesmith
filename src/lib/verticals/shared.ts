import type { Tier } from "@/lib/takeoff/types";
import type { Inputs, RateValue } from "@/lib/verticals/types";

/** The Plansmith/Omniscient-style compounding markup stack, shared across trades. */
export const STANDARD_MARKUP = [
  { key: "general_conditions", label: "General conditions", rate: 0.08 },
  { key: "overhead_profit", label: "Overhead & profit", rate: 0.1 },
  { key: "contingency", label: "Contingency", rate: 0.05 },
  { key: "escalation", label: "Escalation", rate: 0.03 },
  { key: "bonds_insurance", label: "Bonds & insurance", rate: 0.02 },
];

export const TIER_LABELS: Record<Tier, string> = { good: "Good", better: "Better", best: "Best" };

/** A unit cost (cents) that varies by tier. */
export const tiered = (good: number, better: number, best: number): RateValue => ({ good, better, best });

/** Numeric input helper for qty functions. */
export const n = (i: Inputs, key: string): number => Number(i[key]) || 0;
