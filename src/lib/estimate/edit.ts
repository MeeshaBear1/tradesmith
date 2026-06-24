import { buildTierFromItems } from "@/lib/estimate/tier";
import { RATE_CEILING_CENTS, clampCents } from "@/lib/verticals/rate-overrides";
import type { EstimateTier, ItemCategory, LineItem } from "@/lib/takeoff/types";

/**
 * Server-side line-item editing. The contractor can add, remove, retitle, re-quantity
 * or re-price any line on an estimate; we re-derive the category buckets, the base,
 * the compounding markup and the total here — NEVER trusting a client-sent total.
 * Same ceilings and integer-cents discipline as the rate-override sanitizer.
 */

const CATEGORIES: ItemCategory[] = ["material", "labor", "equipment", "fee"];
const QTY_MAX = 1_000_000;
const DESC_MAX = 200;

export interface LineItemEdit {
  key?: string;
  category?: string;
  description?: string;
  quantity?: number | string;
  unit?: string;
  unitCostCents?: number | string;
}

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function cleanCategory(v: unknown): ItemCategory {
  return CATEGORIES.includes(v as ItemCategory) ? (v as ItemCategory) : "material";
}

function cleanStr(v: unknown, fallback: string, max: number): string {
  const s = typeof v === "string" ? v.trim() : "";
  return (s || fallback).slice(0, max);
}

/**
 * Coerce an untrusted list of edited rows into safe LineItems. Quantities clamp to
 * [0, QTY_MAX]; unit costs clamp to [0, $50,000]; rows that net to zero quantity are
 * dropped (the natural "delete this line" gesture). Returns at least one row only if
 * the caller supplied one — an all-empty edit yields [].
 */
export function sanitizeLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: LineItem[] = [];
  raw.forEach((row, idx) => {
    const r = (row ?? {}) as LineItemEdit;
    const quantity = Math.round(Math.max(0, Math.min(QTY_MAX, toNum(r.quantity))) * 100) / 100;
    if (quantity <= 0) return; // removed line
    const unitCostCents = clampCents(toNum(r.unitCostCents));
    const key = cleanStr(r.key, `line_${idx + 1}`, 64).replace(/\s+/g, "_");
    out.push({
      key,
      category: cleanCategory(r.category),
      description: cleanStr(r.description, "Line item", DESC_MAX),
      quantity,
      unit: cleanStr(r.unit, "ea", 24),
      unitCostCents,
      lineCostCents: Math.round(quantity * unitCostCents),
    });
  });
  return out;
}

/**
 * Recompute one tier from an edited line-item list, reusing the tier's own stored
 * markup stack (key/label/rate) and the estimate's regional factor — so an unchanged
 * edit reproduces the original totals exactly.
 */
export function recomputeTier(
  orig: EstimateTier,
  items: LineItem[],
  regionalFactor: number,
): EstimateTier {
  const stack = orig.markup.map((m) => ({ key: m.key, label: m.label, rate: m.rate }));
  return buildTierFromItems(
    orig.tier,
    orig.label,
    items,
    stack,
    regionalFactor,
    orig.displayQty,
    orig.displayUnit,
  );
}

export { RATE_CEILING_CENTS };
