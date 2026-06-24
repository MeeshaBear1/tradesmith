import { describe, it, expect } from "vitest";
import {
  pitchMultiplier,
  metersPerPixel,
  polygonToFootprint,
  deriveContext,
} from "@/lib/roofing/geometry";
import type { RateCard, RoofingDetail } from "@/lib/takeoff/types";
import rateCardJson from "@/data/roofing-ratecard.json";

const rateCard = rateCardJson as unknown as RateCard;

function detail(over: Partial<RoofingDetail> = {}): RoofingDetail {
  return {
    footprintSqft: 2000,
    perimeterLf: 0,
    pitchX12: 6,
    pitchSource: "ai_guess",
    complexity: "moderate",
    facetCount: 4,
    stories: 1,
    existingLayers: 1,
    obstructions: [],
    ...over,
  };
}

describe("pitchMultiplier — roof slope area factor", () => {
  it("is 1.0 for a flat (0/12) roof", () => {
    expect(pitchMultiplier(0)).toBe(1);
  });

  it("is exactly 1.25 for a 9/12 pitch (3-4-5 triangle)", () => {
    // sqrt(9^2 + 12^2)/12 = sqrt(225)/12 = 15/12 = 1.25
    expect(pitchMultiplier(9)).toBe(1.25);
  });

  it("is sqrt(2) for a 12/12 pitch", () => {
    expect(pitchMultiplier(12)).toBeCloseTo(1.41421356, 7);
  });

  it("clamps negative pitch to flat (never < 1.0)", () => {
    expect(pitchMultiplier(-5)).toBe(1);
  });

  it("is monotonically increasing with steeper pitch", () => {
    for (let p = 0; p < 18; p++) {
      expect(pitchMultiplier(p + 1)).toBeGreaterThan(pitchMultiplier(p));
    }
  });
});

describe("metersPerPixel — Web Mercator ground resolution", () => {
  it("equals the equatorial zoom-0 constant at lat 0, zoom 0", () => {
    expect(metersPerPixel(0, 0)).toBe(156543.03392);
  });

  it("matches the known value at lat 0, zoom 20", () => {
    expect(metersPerPixel(0, 20)).toBeCloseTo(0.14929107, 7);
  });

  it("halves with each zoom level", () => {
    expect(metersPerPixel(0, 10) / metersPerPixel(0, 11)).toBeCloseTo(2, 10);
  });

  it("shrinks by cos(latitude) away from the equator", () => {
    expect(metersPerPixel(45, 20) / metersPerPixel(0, 20)).toBeCloseTo(
      Math.cos((45 * Math.PI) / 180),
      10,
    );
  });
});

describe("polygonToFootprint — shoelace area + perimeter", () => {
  it("computes a full-image unit square at lat 0 / zoom 20 (golden)", () => {
    // groundFt = 600 * metersPerPixel(0,20) * 3.28084 = 293.88007...
    // area = 1 (full normalized square) -> footprint = groundFt^2
    const { footprintSqft, perimeterLf } = polygonToFootprint(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      0,
      20,
    );
    expect(footprintSqft).toBeCloseTo(86365.49563, 3);
    expect(perimeterLf).toBeCloseTo(1175.52028, 3);
  });

  it("a half-area triangle is exactly half the unit-square footprint", () => {
    const square = polygonToFootprint(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      0,
      20,
    ).footprintSqft;
    const triangle = polygonToFootprint(
      [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      0,
      20,
    ).footprintSqft;
    expect(triangle).toBeCloseTo(square / 2, 6);
  });

  it("is winding-order independent (abs of shoelace)", () => {
    const cw = polygonToFootprint(
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ],
      0,
      20,
    ).footprintSqft;
    const ccw = polygonToFootprint(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      0,
      20,
    ).footprintSqft;
    expect(cw).toBeCloseTo(ccw, 6);
  });

  it("degenerate polygons (empty / single point / line) yield zero area", () => {
    expect(polygonToFootprint([], 0, 20)).toEqual({ footprintSqft: 0, perimeterLf: 0 });
    expect(polygonToFootprint([[0.5, 0.5]], 0, 20).footprintSqft).toBe(0);
    expect(
      polygonToFootprint(
        [
          [0, 0],
          [1, 1],
        ],
        0,
        20,
      ).footprintSqft,
    ).toBe(0);
  });
});

describe("deriveContext — derived roofing quantities", () => {
  it("derives the canonical context (footprint 2000, moderate, 6/12) — golden", () => {
    const ctx = deriveContext(detail(), rateCard);
    // pm(6)=1.118034; waste moderate=1.15
    expect(ctx.pitchMultiplier).toBeCloseTo(1.11803399, 7);
    expect(ctx.wasteFactor).toBe(1.15);
    expect(ctx.roofAreaSqft).toBeCloseTo(2236.068, 2); // 2000 * 1.118034
    expect(ctx.adjustedSqft).toBeCloseTo(2571.478, 2); // * 1.15
    expect(ctx.squares).toBeCloseTo(25.71478, 4);
    expect(ctx.billedSquares).toBe(26); // ceil(25.71478*2)/2 = 52/2
  });

  it("falls back to a square-ish perimeter when none is measured", () => {
    const ctx = deriveContext(detail({ perimeterLf: 0 }), rateCard);
    // 4 * sqrt(2000) * 1.1
    expect(ctx.perimeterLf).toBeCloseTo(196.774, 2);
    expect(ctx.eaveLf).toBeCloseTo(ctx.perimeterLf * 0.55, 6);
    expect(ctx.rakeLf).toBeCloseTo(ctx.perimeterLf * 0.45, 6);
    expect(ctx.eaveRakeLf).toBe(ctx.perimeterLf);
    expect(ctx.dripEdgeLf).toBe(ctx.perimeterLf);
  });

  it("uses a measured perimeter verbatim when provided", () => {
    const ctx = deriveContext(detail({ perimeterLf: 300 }), rateCard);
    expect(ctx.perimeterLf).toBe(300);
    expect(ctx.eaveLf).toBeCloseTo(165, 6);
    expect(ctx.rakeLf).toBeCloseTo(135, 6);
  });

  it("clamps a negative footprint to zero and still bills the 0.5-square floor", () => {
    const ctx = deriveContext(detail({ footprintSqft: -500 }), rateCard);
    expect(ctx.footprintSqft).toBe(0);
    expect(ctx.squares).toBe(0);
    expect(ctx.billedSquares).toBe(0.5);
  });

  it("rounds billed squares UP to the next half square (never under-bills)", () => {
    const ctx = deriveContext(detail(), rateCard);
    expect(ctx.billedSquares).toBeGreaterThanOrEqual(ctx.squares);
    expect((ctx.billedSquares * 2) % 1).toBe(0); // a clean half-square
  });

  it("takes the larger of base valley LF and obstruction-derived valleys", () => {
    const simple = deriveContext(detail({ complexity: "simple" }), rateCard);
    expect(simple.valleyLf).toBe(0); // simple base = 0, no obstructions
    const withValleys = deriveContext(
      detail({ complexity: "simple", obstructions: [{ type: "valley", count: 3 }] }),
      rateCard,
    );
    expect(withValleys.valleyLf).toBe(48); // 3 * 16
  });

  it("counts penetrations with a floor of 3 and excludes valleys", () => {
    expect(deriveContext(detail(), rateCard).penetrationCount).toBe(3);
    const many = deriveContext(
      detail({
        obstructions: [
          { type: "vent", count: 5 },
          { type: "skylight", count: 2 },
          { type: "valley", count: 9 }, // not a penetration
        ],
      }),
      rateCard,
    );
    expect(many.penetrationCount).toBe(7);
  });

  it("clamps stories and existing layers to a floor of 1", () => {
    const ctx = deriveContext(detail({ stories: 0, existingLayers: 0 }), rateCard);
    expect(ctx.stories).toBe(1);
    expect(ctx.existingLayers).toBe(1);
  });
});
