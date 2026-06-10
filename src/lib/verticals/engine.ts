import { applyMarkups } from "@/lib/pricing/markup";
import type { EstimateTier, LineItem, Tier } from "@/lib/takeoff/types";
import type { Inputs, RateOverrides, RateValue, VerticalConfig } from "@/lib/verticals/types";

const TIERS: Tier[] = ["good", "better", "best"];

/** Resolve a flat-or-tiered unit cost for a given tier. */
export function resolveRate(rv: RateValue | undefined, tier: Tier, fallback = 0): number {
  if (rv == null) return fallback;
  return typeof rv === "number" ? rv : (rv[tier] ?? fallback);
}

/** Coerce + clamp raw inputs against the config's field definitions. */
export function sanitizeInputs(config: VerticalConfig, raw: Inputs): Inputs {
  const out: Inputs = {};
  for (const f of config.fields) {
    const v = raw?.[f.key];
    if (f.type === "number") {
      const num = typeof v === "number" ? v : Number(v);
      const safe = Number.isFinite(num) ? num : Number(f.default);
      out[f.key] = Math.min(f.max ?? 1e9, Math.max(f.min ?? 0, safe));
    } else {
      const allowed = (f.options ?? []).map((o) => o.value);
      out[f.key] = typeof v === "string" && allowed.includes(v) ? v : String(f.default);
    }
  }
  return out;
}

export function defaultInputs(config: VerticalConfig): Inputs {
  return Object.fromEntries(config.fields.map((f) => [f.key, f.default]));
}

function buildTier(
  config: VerticalConfig,
  inputs: Inputs,
  tier: Tier,
  overrides?: RateOverrides,
): EstimateTier {
  const items: LineItem[] = [];
  for (const ln of config.lines) {
    if (ln.tiers && !ln.tiers.includes(tier)) continue;
    const quantity = Math.round(Math.max(0, ln.qty(inputs, tier)) * 100) / 100;
    if (quantity <= 0) continue;
    const rateKey = ln.rateKey ?? ln.key;
    const rv = overrides?.rates?.[rateKey] ?? config.rates[rateKey];
    const unitCostCents = Math.max(0, Math.round(resolveRate(rv, tier)));
    const label = typeof ln.label === "function" ? ln.label(inputs, tier) : ln.label;
    items.push({
      key: ln.key,
      category: ln.category,
      description: label,
      quantity,
      unit: ln.unit,
      unitCostCents,
      lineCostCents: Math.round(quantity * unitCostCents),
    });
  }

  const sum = (c: LineItem["category"]) =>
    items.filter((i) => i.category === c).reduce((s, i) => s + i.lineCostCents, 0);
  const materialCents = sum("material");
  const laborCents = sum("labor");
  const disposalCents = sum("equipment");
  const feeCents = sum("fee");
  const baseCents = materialCents + laborCents + disposalCents + feeCents;

  const regionalFactor = overrides?.regionalFactor ?? config.regionalFactor;
  const { totalCents, layers } = applyMarkups(baseCents, config.markupStack, regionalFactor);

  const displayQty = Math.max(1, Math.round(Number(inputs[config.primaryQuantityKey]) || 0));

  return {
    tier,
    label: config.tierLabels[tier],
    lineItems: items,
    displayQty,
    displayUnit: config.unitLabel,
    squares: displayQty,
    materialCents,
    laborCents,
    disposalCents,
    feeCents,
    baseCents,
    markup: layers,
    totalCents,
    pricePerSquareCents: Math.round(totalCents / Math.max(1, displayQty)),
  };
}

/** Generic Good/Better/Best estimate for any form-based vertical, with optional rate overrides. */
export function estimateVertical(
  config: VerticalConfig,
  raw: Inputs,
  overrides?: RateOverrides,
): EstimateTier[] {
  const inputs = sanitizeInputs(config, raw);
  return TIERS.map((tier) => buildTier(config, inputs, tier, overrides));
}
