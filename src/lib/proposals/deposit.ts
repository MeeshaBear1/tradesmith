import type { Tier } from "@/lib/takeoff/types";

/** Deposit collected when a homeowner accepts a proposal. */
export const DEPOSIT_PCT = 0.35;

const TIERS: Tier[] = ["good", "better", "best"];

/** Deposit owed on a tier total — rounded to whole cents. */
export function depositCents(totalCents: number): number {
  return Math.round(totalCents * DEPOSIT_PCT);
}

/**
 * The homeowner's chosen tier governs the deposit — but only if it's a real,
 * allow-listed tier that actually exists in this estimate. Otherwise fall back.
 */
export function resolveChosenTier(
  requested: string | undefined,
  available: { tier: Tier }[] | undefined,
  fallback: Tier = "better",
): Tier {
  return requested && TIERS.includes(requested as Tier) && available?.some((t) => t.tier === requested)
    ? (requested as Tier)
    : fallback;
}

/**
 * Re-derive the charge amount server-side from the chosen tier — never trust a
 * client-supplied amount. Falls back to a provided total if the tier is missing.
 */
export function deriveAmountCents(
  tiers: { tier: Tier; totalCents: number }[] | undefined,
  chosen: Tier,
  fallbackTotal = 0,
): number {
  return tiers?.find((t) => t.tier === chosen)?.totalCents ?? fallbackTotal;
}
