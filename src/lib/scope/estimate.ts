import { buildTierFromItems } from "@/lib/estimate/tier";
import { resolveRate } from "@/lib/verticals/engine";
import { STANDARD_MARKUP, TIER_LABELS } from "@/lib/verticals/shared";
import type { MarkupConfig } from "@/lib/pricing/markup";
import type { EstimateTier, LineItem, Tier } from "@/lib/takeoff/types";
import type { ScopeLineSeed } from "@/lib/scope/types";

const TIERS: Tier[] = ["good", "better", "best"];

export interface ScopeEstimateOpts {
  markupStack?: MarkupConfig[];
  regionalFactor?: number;
  displayUnit?: string;
  displayQty?: number;
}

/** Resolve scope seeds into concrete line items for one tier. */
export function scopeLineItemsForTier(items: ScopeLineSeed[], tier: Tier): LineItem[] {
  const out: LineItem[] = [];
  for (const it of items) {
    const quantity = Math.round(Math.max(0, it.quantity) * 100) / 100;
    if (quantity <= 0) continue;
    const unitCostCents = Math.max(0, Math.round(resolveRate(it.unitCost, tier)));
    out.push({
      key: it.key,
      category: it.category,
      description: it.description,
      quantity,
      unit: it.unit,
      unitCostCents,
      lineCostCents: Math.round(quantity * unitCostCents),
    });
  }
  return out;
}

/**
 * Price a photo-inferred scope into Good/Better/Best, through the same compounding
 * markup stack every other trade uses. Tiers differ by finish-quality unit costs,
 * so richer tiers never cost less.
 */
export function estimateFromScope(items: ScopeLineSeed[], opts: ScopeEstimateOpts = {}): EstimateTier[] {
  const stack = opts.markupStack ?? STANDARD_MARKUP;
  const regionalFactor = opts.regionalFactor ?? 1;
  const displayUnit = opts.displayUnit ?? "sq ft";
  const displayQty = Math.max(1, Math.round(opts.displayQty ?? 0) || 1);

  return TIERS.map((tier) =>
    buildTierFromItems(
      tier,
      TIER_LABELS[tier],
      scopeLineItemsForTier(items, tier),
      stack,
      regionalFactor,
      displayQty,
      displayUnit,
    ),
  );
}
