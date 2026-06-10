import type { Complexity, RateCard, RoofingDetail } from "@/lib/takeoff/types";

/** Web Mercator ground resolution: meters per (logical) pixel at zoom 0, equator. */
const EARTH_CIRC_M_PER_PX = 156543.03392;
const M_TO_FT = 3.28084;

/** Roof slope area factor = sqrt(rise^2 + run^2) / run, run = 12. */
export function pitchMultiplier(x12: number): number {
  const p = Math.max(0, x12);
  return Math.sqrt(p * p + 144) / 12;
}

/** Meters per logical pixel at a given latitude/zoom. */
export function metersPerPixel(lat: number, zoom: number): number {
  return (EARTH_CIRC_M_PER_PX * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

/**
 * Convert a roof outline traced in normalized [0,1] image coordinates into a
 * real-world footprint + perimeter. We compute area ourselves (shoelace) rather
 * than trusting the vision model's arithmetic.
 *
 * Works in normalized units: the image spans `imgLogicalSize * metersPerPixel`
 * meters of ground on each axis, regardless of @2x (which only adds resolution).
 */
export function polygonToFootprint(
  polyNorm: [number, number][],
  lat: number,
  zoom: number,
  imgLogicalSize = 600,
): { footprintSqft: number; perimeterLf: number } {
  const groundFt = imgLogicalSize * metersPerPixel(lat, zoom) * M_TO_FT;

  let area2 = 0;
  let perimNorm = 0;
  for (let i = 0; i < polyNorm.length; i++) {
    const [x1, y1] = polyNorm[i];
    const [x2, y2] = polyNorm[(i + 1) % polyNorm.length];
    area2 += x1 * y2 - x2 * y1;
    perimNorm += Math.hypot(x2 - x1, y2 - y1);
  }
  const normArea = Math.abs(area2) / 2;

  return {
    footprintSqft: normArea * groundFt * groundFt,
    perimeterLf: perimNorm * groundFt,
  };
}

const RIDGE_HIP_FACTOR: Record<Complexity, number> = { simple: 0.9, moderate: 1.3, complex: 1.8 };
const BASE_VALLEY_LF: Record<Complexity, number> = { simple: 0, moderate: 16, complex: 40 };

/** Derived quantities used by the estimate engine — shared across all tiers. */
export interface RoofContext {
  footprintSqft: number;
  perimeterLf: number;
  pitchX12: number;
  pitchMultiplier: number;
  complexity: Complexity;
  wasteFactor: number;
  roofAreaSqft: number;
  adjustedSqft: number;
  squares: number;
  billedSquares: number;
  eaveLf: number;
  rakeLf: number;
  eaveRakeLf: number;
  dripEdgeLf: number;
  ridgeHipLf: number;
  ridgeLf: number;
  valleyLf: number;
  penetrationCount: number;
  stories: number;
  existingLayers: number;
}

const PENETRATION_TYPES = new Set(["vent", "hvac_unit", "skylight", "chimney", "other", "solar_panel"]);

export function deriveContext(detail: RoofingDetail, rateCard: RateCard): RoofContext {
  const complexity = detail.complexity;
  const footprintSqft = Math.max(0, detail.footprintSqft);

  // Fall back to a square-ish perimeter (with a cut-up factor) when not measured.
  const perimeterLf =
    detail.perimeterLf && detail.perimeterLf > 0
      ? detail.perimeterLf
      : 4 * Math.sqrt(footprintSqft) * 1.1;

  const pm = pitchMultiplier(detail.pitchX12);
  const wasteFactor = rateCard.wasteFactors[complexity];
  const roofAreaSqft = footprintSqft * pm;
  const adjustedSqft = roofAreaSqft * wasteFactor;
  const squares = adjustedSqft / 100;
  const billedSquares = Math.max(0.5, Math.ceil(squares * 2) / 2);

  const valleyFromObstructions =
    (detail.obstructions ?? [])
      .filter((o) => o.type === "valley")
      .reduce((s, o) => s + o.count, 0) * 16;

  const penetrationCount = Math.max(
    3,
    (detail.obstructions ?? [])
      .filter((o) => PENETRATION_TYPES.has(o.type))
      .reduce((s, o) => s + o.count, 0),
  );

  const ridgeHipLf = Math.sqrt(footprintSqft) * RIDGE_HIP_FACTOR[complexity];

  return {
    footprintSqft,
    perimeterLf,
    pitchX12: detail.pitchX12,
    pitchMultiplier: pm,
    complexity,
    wasteFactor,
    roofAreaSqft,
    adjustedSqft,
    squares,
    billedSquares,
    eaveLf: perimeterLf * 0.55,
    rakeLf: perimeterLf * 0.45,
    eaveRakeLf: perimeterLf,
    dripEdgeLf: perimeterLf,
    ridgeHipLf,
    ridgeLf: ridgeHipLf * 0.5,
    valleyLf: Math.max(BASE_VALLEY_LF[complexity], valleyFromObstructions),
    penetrationCount,
    stories: Math.max(1, detail.stories || 1),
    existingLayers: Math.max(1, detail.existingLayers || 1),
  };
}
