import { getVertical, isVertical } from "@/lib/verticals/registry";
import type { RateConfig, RateTable, RateValue } from "@/lib/verticals/types";

/** $50,000 per unit — well above any real rate; also guards the charge path from int overflow. */
export const RATE_CEILING_CENTS = 5_000_000;

export const clampCents = (v: number): number =>
  Math.min(RATE_CEILING_CENTS, Math.max(0, Math.round(v)));

/** A contractor-supplied regional factor, clamped to a sane 0.5x–2.5x band (default 1x). */
export function clampRegionalFactor(raw: unknown): number {
  const rf = Number(raw);
  return Number.isFinite(rf) ? Math.min(2.5, Math.max(0.5, rf)) : 1;
}

/**
 * Validate one override value AGAINST ITS SEED so it can't change the pricing
 * semantics: the override must match the seed's flat/tiered shape, is clamped to a
 * sane ceiling (prevents int overflow on the charge path), and tiered values are
 * sorted ascending so Good <= Better <= Best can never invert.
 */
export function cleanAgainstSeed(seed: RateValue | undefined, v: unknown): RateValue | null {
  if (seed == null) return null; // unknown rateKey — drop (key allow-list)
  const seedTiered = typeof seed === "object";

  if (!seedTiered) {
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    return clampCents(v);
  }

  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ok = (["good", "better", "best"] as const).every(
    (k) => typeof o[k] === "number" && Number.isFinite(o[k] as number),
  );
  if (!ok) return null;
  const sorted = [o.good as number, o.better as number, o.best as number]
    .map(clampCents)
    .sort((a, b) => a - b);
  return { good: sorted[0], better: sorted[1], best: sorted[2] };
}

/**
 * Turn a raw, untrusted request body into a safe {@link RateConfig}: a clamped
 * regional factor plus per-trade rate overrides that are key-allow-listed,
 * shape-checked, clamped, and tier-sorted. Roofing is geometry-priced, so its
 * overrides are rejected. Unknown trades and unknown rate keys are dropped.
 */
export function sanitizeRateConfig(
  body: { regionalFactor?: unknown; rates?: Record<string, Record<string, unknown>> } | null | undefined,
): RateConfig {
  const regionalFactor = clampRegionalFactor(body?.regionalFactor);

  const rates: Record<string, RateTable> = {};
  for (const [vertical, table] of Object.entries(body?.rates ?? {})) {
    // Only known, form-priced trades. Roofing is geometry-priced; its overrides are ignored, so reject them.
    if (!isVertical(vertical) || vertical === "roofing" || !table || typeof table !== "object") continue;
    const seedRates = getVertical(vertical).rates;
    const clean: RateTable = {};
    for (const [k, v] of Object.entries(table)) {
      const cv = cleanAgainstSeed(seedRates[k], v); // seedRates[k] === undefined → dropped
      if (cv != null) clean[k] = cv;
    }
    if (Object.keys(clean).length) rates[vertical] = clean;
  }

  return { regionalFactor, rates };
}
