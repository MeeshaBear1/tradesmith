import rateCardJson from "@/data/roofing-ratecard.json";
import type {
  Complexity,
  EstimateTier,
  Job,
  MeasureOptions,
  Measurement,
  RateCard,
  RoofingDetail,
  TakeoffEngine,
} from "@/lib/takeoff/types";
import { estimateRoofing } from "@/lib/roofing/estimate";
import { metersPerPixel, polygonToFootprint } from "@/lib/roofing/geometry";
import {
  analyzeRoofImage,
  fetchImageBase64,
  geocodeAddress,
  staticImageUrl,
  TILE_ZOOM,
  TILE_ZOOM_FALLBACK,
  type ReportRoof,
} from "@/lib/roofing/vision";

const RATE_CARD = rateCardJson as unknown as RateCard;
const PITCH_DEFAULT: Record<Complexity, number> = { simple: 5, moderate: 6, complex: 7 };
const STUB_FOOTPRINT_SQFT = 2400;

function band(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.55) return "medium";
  return "low";
}

function validPolygon(poly: unknown): poly is [number, number][] {
  return (
    Array.isArray(poly) &&
    poly.length >= 3 &&
    poly.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        p.every((n) => typeof n === "number" && n >= -0.05 && n <= 1.05),
    )
  );
}

function manualDetail(opts?: MeasureOptions): RoofingDetail {
  const m = opts?.manual ?? {};
  const complexity: Complexity = m.complexity ?? "moderate";
  return {
    footprintSqft: m.footprintSqft ?? STUB_FOOTPRINT_SQFT,
    perimeterLf: m.perimeterLf ?? 0,
    pitchX12: m.pitchX12 ?? PITCH_DEFAULT[complexity],
    pitchSource: m.pitchX12 ? "user_override" : "complexity_default",
    complexity,
    facetCount: m.facetCount ?? 4,
    stories: m.stories ?? 1,
    existingLayers: m.existingLayers ?? 1,
    obstructions: m.obstructions ?? [],
  };
}

function manualMeasurement(opts: MeasureOptions | undefined, isStub: boolean): Measurement {
  const detail = manualDetail(opts);
  return {
    vertical: "roofing",
    primaryQuantity: detail.footprintSqft,
    unit: "sqft",
    detail,
    confidence: isStub ? 0.5 : 0.9,
    confidenceBand: isStub ? "low" : "high",
    source: "manual",
    satelliteImageUrl: null,
    rawAiOutput: null,
    reasoning: isStub
      ? "Demo stub measurement — no imagery available. Enter the real footprint and pitch to price accurately."
      : "Manually entered measurement.",
    forceConfirm: isStub,
    forceConfirmReasons: isStub ? ["no_imagery"] : [],
  };
}

function buildAiMeasurement(
  report: ReportRoof,
  lat: number,
  zoom: number,
  imageUrl: string,
  relevance: number,
): Measurement {
  const { footprintSqft, perimeterLf } = polygonToFootprint(report.roof_polygon_norm, lat, zoom);
  const complexity = report.complexity;

  const hasPitch = report.predominant_pitch_guess_x12 != null && report.predominant_pitch !== "unknown";
  const pitchX12 = hasPitch ? Number(report.predominant_pitch_guess_x12) : PITCH_DEFAULT[complexity];

  const detail: RoofingDetail = {
    footprintSqft: Math.round(footprintSqft),
    perimeterLf: Math.round(perimeterLf),
    pitchX12,
    pitchSource: hasPitch ? "ai_guess" : "complexity_default",
    complexity,
    facetCount: report.facet_count ?? 4,
    stories: report.stories_guess ?? 1,
    existingLayers: 1,
    obstructions: report.obstructions ?? [],
  };

  // Adjust confidence with server-side sanity checks.
  let confidence = clamp01(report.confidence ?? 0.5);
  const reasons: string[] = [];

  if (!report.building_identified) reasons.push("no_building");
  if (report.roof_touches_edge) {
    confidence -= 0.2;
    reasons.push("roof_clipped");
  }
  if ((report.obstructions ?? []).some((o) => o.type === "tree_overhang")) {
    confidence -= 0.15;
    reasons.push("tree_overhang");
  }
  if (footprintSqft < 200 || footprintSqft > 12000) reasons.push("implausible_footprint");
  if (!hasPitch) reasons.push("pitch_assumed");
  if (relevance < 0.8) reasons.push("address_uncertain");

  const self = report.self_estimated_footprint_sqft;
  if (self && footprintSqft > 0 && Math.abs(self - footprintSqft) / footprintSqft > 0.5) {
    confidence -= 0.2;
    reasons.push("self_estimate_disagreement");
  }
  confidence = clamp01(confidence);

  // Force confirm for any real-quality concern. A pure "pitch assumed" case is
  // surfaced as an editable default but does not block, per design.
  const forceConfirm = confidence < 0.55 || reasons.some((r) => r !== "pitch_assumed");

  return {
    vertical: "roofing",
    primaryQuantity: detail.footprintSqft,
    unit: "sqft",
    detail,
    confidence,
    confidenceBand: band(confidence),
    source: "ai",
    satelliteImageUrl: imageUrl,
    rawAiOutput: report,
    reasoning: report.reasoning,
    forceConfirm,
    forceConfirmReasons: reasons,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

async function measure(job: Job, opts?: MeasureOptions): Promise<Measurement> {
  // Any explicit manual input takes the manual path; isStub only when no real footprint.
  if (opts?.manual && Object.keys(opts.manual).length > 0) {
    return manualMeasurement(opts, !opts.manual.footprintSqft);
  }

  // Try AI: geocode (or use job coords) -> tile -> vision.
  const geo =
    job.lat != null && job.lng != null
      ? { lat: job.lat, lng: job.lng, relevance: 1 }
      : await geocodeAddress(job.address);

  if (!geo) return manualMeasurement(opts, true);

  let zoom = TILE_ZOOM;
  let imageUrl = staticImageUrl(geo.lng, geo.lat, zoom);
  const img = await fetchImageBase64(imageUrl);
  if (!img) return manualMeasurement(opts, true);

  // The image is rendered @2x, so a physical pixel is half a logical pixel.
  let report = await analyzeRoofImage(img.data, img.mediaType, job.address, metersPerPixel(geo.lat, zoom) / 2);
  if (!report || !validPolygon(report.roof_polygon_norm)) return manualMeasurement(opts, true);

  // One retry at lower zoom if the roof is clipped — adopt zoom/url/report atomically
  // so the area is never scaled with a mismatched zoom.
  if (report.roof_touches_edge) {
    const retryZoom = TILE_ZOOM_FALLBACK;
    const retryUrl = staticImageUrl(geo.lng, geo.lat, retryZoom);
    const retryImg = await fetchImageBase64(retryUrl);
    if (retryImg) {
      const retry = await analyzeRoofImage(
        retryImg.data,
        retryImg.mediaType,
        job.address,
        metersPerPixel(geo.lat, retryZoom) / 2,
      );
      if (retry && validPolygon(retry.roof_polygon_norm)) {
        report = retry;
        zoom = retryZoom;
        imageUrl = retryUrl;
      }
    }
  }

  return buildAiMeasurement(report, geo.lat, zoom, imageUrl, geo.relevance);
}

export const roofingEngine: TakeoffEngine = {
  vertical: "roofing",
  measure,
  estimate: (measurement: Measurement, rateCard: RateCard): EstimateTier[] =>
    estimateRoofing(measurement, rateCard),
  defaultRateCard: () => RATE_CARD,
};
