import type { EstimateTier, Inputs, ItemCategory, Tier, Vertical } from "@/lib/takeoff/types";

export type { Inputs };

export type FieldType = "number" | "select";

export interface MeasureField {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  default: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  help?: string;
}

export type Calc = (i: Inputs, tier: Tier) => number;

/** A unit cost in cents — either flat, or one value per Good/Better/Best tier. */
export type RateValue = number | { good: number; better: number; best: number };

export type RateTable = Record<string, RateValue>;

/** Per-contractor overrides applied on top of a trade's seed rates. */
export interface RateOverrides {
  regionalFactor?: number;
  rates?: RateTable;
}

/** A contractor's saved pricing: a global regional factor + per-trade rate overrides. */
export interface RateConfig {
  regionalFactor: number;
  rates: Record<string, RateTable>; // keyed by vertical
}

/**
 * A declarative priced line item. Quantity is a function of inputs; the UNIT COST
 * comes from the trade's editable `rates` table (so contractors can tune pricing
 * without code). `rateKey` defaults to `key`.
 */
export interface LineSpec {
  key: string;
  category: ItemCategory;
  label: string | ((i: Inputs, tier: Tier) => string);
  unit: string;
  qty: Calc;
  rateKey?: string;
  /** Restrict this line to specific tiers (default: all). */
  tiers?: Tier[];
}

/**
 * A construction trade. Roofing uses an AI measurement; other trades use a simple
 * input form. Both produce the SAME Good/Better/Best EstimateTier[] consumed by the
 * shared estimate → proposal → invoice → payment pipeline.
 */
export interface VerticalConfig {
  key: Vertical;
  label: string;
  icon: string;
  blurb: string;
  unitLabel: string; // e.g. "squares", "sq ft", "windows", "linear ft"
  measurementMode: "ai" | "form";
  /** Input fields for the form path (roofing also uses these as its editable detail). */
  fields: MeasureField[];
  /** Declarative line items for the form path. Roofing computes its own (geometry). */
  lines: LineSpec[];
  /** Editable seed unit costs (cents), keyed by line/rateKey. */
  rates: RateTable;
  tierLabels: Record<Tier, string>;
  markupStack: { key: string; label: string; rate: number }[];
  regionalFactor: number;
  /** The input whose value is shown as the job "size". */
  primaryQuantityKey: string;
  /** One-line scope blurb for the proposal copy fallback. */
  scopeBlurb: (i: Inputs, tier: EstimateTier) => string;
}
