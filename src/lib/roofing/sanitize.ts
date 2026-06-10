import type { Complexity, RoofingDetail } from "@/lib/takeoff/types";

const COMPLEXITIES: Complexity[] = ["simple", "moderate", "complex"];

function clampNum(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

/**
 * Sanitize a client-supplied measurement override before it is priced.
 * Clamps numerics to sane ranges and rejects out-of-enum complexity, so a bad
 * payload can never produce NaN/overflow estimates persisted to the DB.
 */
export function sanitizeDetailOverride(input: Partial<RoofingDetail> | undefined): Partial<RoofingDetail> {
  if (!input || typeof input !== "object") return {};
  const out: Partial<RoofingDetail> = {};
  if (input.footprintSqft != null) out.footprintSqft = clampNum(input.footprintSqft, 100, 50000, 1500);
  if (input.perimeterLf != null) out.perimeterLf = clampNum(input.perimeterLf, 0, 5000, 0);
  if (input.pitchX12 != null) out.pitchX12 = Math.round(clampNum(input.pitchX12, 0, 24, 6));
  if (input.complexity != null && COMPLEXITIES.includes(input.complexity)) out.complexity = input.complexity;
  if (input.stories != null) out.stories = Math.round(clampNum(input.stories, 1, 4, 1));
  if (input.existingLayers != null) out.existingLayers = Math.round(clampNum(input.existingLayers, 1, 4, 1));
  if (input.facetCount != null) out.facetCount = Math.round(clampNum(input.facetCount, 1, 40, 4));
  if (input.pitchSource === "user_override") out.pitchSource = "user_override";
  return out;
}
