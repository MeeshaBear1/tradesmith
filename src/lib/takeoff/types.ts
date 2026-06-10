/**
 * Vertical-pluggable takeoff contract.
 *
 * Roofing ships tonight; electrical / hvac / gc slot in later by implementing
 * `TakeoffEngine` and adding one entry to the registry. Nothing else changes.
 */

export type Vertical =
  | "roofing"
  | "siding"
  | "gutters"
  | "windows"
  | "remodel"
  | "electrical"
  | "hvac"
  | "plumbing"
  | "solar"
  | "painting"
  | "concrete"
  | "fencing"
  | "decking"
  | "insulation"
  | "drywall"
  | "flooring";

/** Generic measurement/job inputs keyed by field (used by form-based verticals). */
export type Inputs = Record<string, number | string>;

export type MeasurementSource = "ai" | "manual" | "ai_overridden";
export type Complexity = "simple" | "moderate" | "complex";
export type ConfidenceBand = "high" | "medium" | "low";
export type Tier = "good" | "better" | "best";
export type ItemCategory = "material" | "labor" | "equipment" | "fee";

export interface Job {
  id: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}

export interface Obstruction {
  type: string;
  count: number;
}

/** Roofing-specific measurement detail (lives in `Measurement.detail`). */
export interface RoofingDetail {
  footprintSqft: number;
  perimeterLf: number;
  pitchX12: number;
  pitchSource: "user_override" | "ai_guess" | "complexity_default";
  complexity: Complexity;
  facetCount: number;
  stories: number;
  existingLayers: number;
  obstructions: Obstruction[];
}

/** Normalized output of the MEASURE step for any vertical. */
export interface Measurement {
  vertical: Vertical;
  primaryQuantity: number; // roofing: building footprint sqft
  unit: string; // roofing: "sqft"
  detail: RoofingDetail;
  confidence: number; // 0..1
  confidenceBand: ConfidenceBand;
  source: MeasurementSource;
  satelliteImageUrl?: string | null;
  rawAiOutput?: unknown;
  reasoning?: string | null;
  forceConfirm: boolean;
  forceConfirmReasons: string[];
}

export interface LineItem {
  key: string;
  category: ItemCategory;
  description: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  lineCostCents: number;
}

export interface MarkupLayer {
  key: string;
  label: string;
  rate: number;
  amountCents: number;
  runningCents: number;
}

export interface EstimateTier {
  tier: Tier;
  label: string;
  lineItems: LineItem[];
  /** Display quantity + unit (roofing: squares; siding: sqft; windows: each; etc.) */
  displayQty: number;
  displayUnit: string;
  /** Roofing-specific; kept for back-compat. Other verticals leave as displayQty. */
  squares: number;
  materialCents: number;
  laborCents: number;
  disposalCents: number;
  feeCents: number;
  baseCents: number;
  markup: MarkupLayer[];
  totalCents: number;
  pricePerSquareCents: number;
}

// ---- Rate card (mirrors data/roofing-ratecard.json) ----

export interface MaterialRate {
  unit: string;
  desc: string;
  costCents: number;
  perSquare?: number;
  basis?: string;
}

export interface RateCard {
  version: string;
  region: string;
  regionalFactor: number;
  wasteFactors: Record<Complexity, number>;
  materials: Record<string, MaterialRate>;
  teardown: {
    tearoff_labor: { unit: string; costCents: number; perLayerMultiplier: number; desc: string };
    dumpster: { unit: string; costCents: number; squaresPerDumpster: number; desc: string };
  };
  labor: {
    installPerSquareCents: Record<Complexity, number>;
    steepThresholdX12: number;
    steepPerSquareAddCents: number;
    twoStoryAddPerSquareCents: number;
  };
  markupStack: { key: string; label: string; rate: number }[];
  tiers: Record<
    Tier,
    {
      label: string;
      shingle: string;
      underlayment: string;
      iceWaterScope: "eaves" | "eaves_valleys" | "full";
      ridgeVent: boolean;
    }
  >;
}

export interface MeasureOptions {
  /** Manual override inputs; when present, skips AI and uses these directly. */
  manual?: Partial<RoofingDetail> & { footprintSqft?: number };
}

export interface TakeoffEngine {
  vertical: Vertical;
  measure(job: Job, opts?: MeasureOptions): Promise<Measurement>;
  estimate(measurement: Measurement, rateCard: RateCard): EstimateTier[];
  defaultRateCard(): RateCard;
}
