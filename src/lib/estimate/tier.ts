import { applyMarkups, type MarkupConfig } from "@/lib/pricing/markup";
import type { EstimateTier, LineItem, Tier } from "@/lib/takeoff/types";

/**
 * Build a single Good/Better/Best tier from a finished list of line items.
 *
 * This is the ONE place that turns line items into a priced tier — shared by the
 * scope estimator (photo → quote) and the line-item editor (recompute after an
 * edit). Money is integer cents throughout; the regional factor lifts the base
 * before the compounding markup stack, exactly like the form-vertical engine.
 */
export function buildTierFromItems(
  tier: Tier,
  label: string,
  items: LineItem[],
  stack: MarkupConfig[],
  regionalFactor: number,
  displayQty: number,
  displayUnit: string,
): EstimateTier {
  const sum = (c: LineItem["category"]) =>
    items.filter((i) => i.category === c).reduce((s, i) => s + i.lineCostCents, 0);
  const materialCents = sum("material");
  const laborCents = sum("labor");
  const disposalCents = sum("equipment");
  const feeCents = sum("fee");
  const baseCents = materialCents + laborCents + disposalCents + feeCents;

  const { totalCents, layers } = applyMarkups(baseCents, stack, regionalFactor);
  const dq = Math.max(1, Math.round(displayQty) || 1);

  return {
    tier,
    label,
    lineItems: items,
    displayQty: dq,
    displayUnit,
    squares: dq,
    materialCents,
    laborCents,
    disposalCents,
    feeCents,
    baseCents,
    markup: layers,
    totalCents,
    pricePerSquareCents: Math.round(totalCents / Math.max(1, dq)),
  };
}
