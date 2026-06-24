import { describe, it, expect } from "vitest";
import { estimateRoofing } from "@/lib/roofing/estimate";
import { applyMarkups } from "@/lib/pricing/markup";
import type { EstimateTier, Measurement, RateCard, RoofingDetail } from "@/lib/takeoff/types";
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

function measurement(over: Partial<RoofingDetail> = {}): Measurement {
  const d = detail(over);
  return {
    vertical: "roofing",
    primaryQuantity: d.footprintSqft,
    unit: "sqft",
    detail: d,
    confidence: 0.8,
    confidenceBand: "high",
    source: "ai",
    forceConfirm: false,
    forceConfirmReasons: [],
  };
}

const lineFor = (t: EstimateTier, key: string) => t.lineItems.find((i) => i.key === key);

describe("estimateRoofing — tier structure", () => {
  it("returns exactly three tiers in good/better/best order", () => {
    const tiers = estimateRoofing(measurement(), rateCard);
    expect(tiers.map((t) => t.tier)).toEqual(["good", "better", "best"]);
  });

  it("every tier has non-empty line items and positive money fields", () => {
    for (const t of estimateRoofing(measurement(), rateCard)) {
      expect(t.lineItems.length).toBeGreaterThan(0);
      expect(t.materialCents).toBeGreaterThan(0);
      expect(t.laborCents).toBeGreaterThan(0);
      expect(t.disposalCents).toBeGreaterThan(0);
      expect(t.baseCents).toBeGreaterThan(0);
      expect(t.totalCents).toBeGreaterThan(0);
    }
  });

  it("emits only whole integer cents everywhere", () => {
    for (const t of estimateRoofing(measurement(), rateCard)) {
      for (const c of [t.materialCents, t.laborCents, t.disposalCents, t.baseCents, t.totalCents, t.pricePerSquareCents]) {
        expect(Number.isInteger(c)).toBe(true);
      }
      for (const li of t.lineItems) {
        expect(Number.isInteger(li.lineCostCents)).toBe(true);
        expect(Number.isInteger(li.unitCostCents)).toBe(true);
      }
    }
  });
});

describe("estimateRoofing — internal consistency (numbers tie out)", () => {
  it("base = material + labor + disposal + fee, and category sums match line items", () => {
    for (const t of estimateRoofing(measurement(), rateCard)) {
      const matSum = t.lineItems.filter((i) => i.category === "material").reduce((s, i) => s + i.lineCostCents, 0);
      const labSum = t.lineItems.filter((i) => i.category === "labor").reduce((s, i) => s + i.lineCostCents, 0);
      const eqSum = t.lineItems.filter((i) => i.category === "equipment").reduce((s, i) => s + i.lineCostCents, 0);
      expect(t.materialCents).toBe(matSum);
      expect(t.laborCents).toBe(labSum);
      expect(t.disposalCents).toBe(eqSum);
      expect(t.baseCents).toBe(t.materialCents + t.laborCents + t.disposalCents + t.feeCents);
    }
  });

  it("each line cost equals round(quantity * unit cost)", () => {
    for (const t of estimateRoofing(measurement(), rateCard)) {
      for (const li of t.lineItems) {
        expect(li.lineCostCents).toBe(Math.round(li.quantity * li.unitCostCents));
      }
    }
  });

  it("total = the markup stack applied to base, and exceeds base", () => {
    for (const t of estimateRoofing(measurement(), rateCard)) {
      const { totalCents } = applyMarkups(t.baseCents, rateCard.markupStack, rateCard.regionalFactor);
      expect(t.totalCents).toBe(totalCents);
      expect(t.markup.length).toBe(rateCard.markupStack.length);
      expect(t.totalCents).toBeGreaterThan(t.baseCents);
    }
  });

  it("price per square = round(total / billed squares)", () => {
    for (const t of estimateRoofing(measurement(), rateCard)) {
      expect(t.pricePerSquareCents).toBe(Math.round(t.totalCents / t.squares));
    }
  });
});

describe("estimateRoofing — ordering & monotonicity", () => {
  it("good <= better <= best on total price (richer materials cost more)", () => {
    const [good, better, best] = estimateRoofing(measurement(), rateCard);
    expect(good.totalCents).toBeLessThan(better.totalCents);
    expect(better.totalCents).toBeLessThan(best.totalCents);
  });

  it("ridge vent appears only in the upgraded tiers", () => {
    const [good, better, best] = estimateRoofing(measurement(), rateCard);
    expect(lineFor(good, "ridge_vent")).toBeUndefined();
    expect(lineFor(better, "ridge_vent")).toBeDefined();
    expect(lineFor(best, "ridge_vent")).toBeDefined();
  });

  it("a larger footprint never lowers the price", () => {
    const small = estimateRoofing(measurement({ footprintSqft: 1500 }), rateCard)[0].totalCents;
    const big = estimateRoofing(measurement({ footprintSqft: 3500 }), rateCard)[0].totalCents;
    expect(big).toBeGreaterThan(small);
  });

  it("is deterministic for identical inputs", () => {
    expect(estimateRoofing(measurement(), rateCard)).toEqual(estimateRoofing(measurement(), rateCard));
  });
});

describe("estimateRoofing — labor adders", () => {
  it("adds the steep premium per square once pitch crosses the threshold", () => {
    const flat = lineFor(estimateRoofing(measurement({ pitchX12: 4 }), rateCard)[1], "install_labor")!;
    const steep = lineFor(estimateRoofing(measurement({ pitchX12: 10 }), rateCard)[1], "install_labor")!;
    expect(steep.unitCostCents - flat.unitCostCents).toBe(rateCard.labor.steepPerSquareAddCents);
  });

  it("adds the two-story premium per square for 2+ stories", () => {
    const one = lineFor(estimateRoofing(measurement({ pitchX12: 4, stories: 1 }), rateCard)[1], "install_labor")!;
    const two = lineFor(estimateRoofing(measurement({ pitchX12: 4, stories: 2 }), rateCard)[1], "install_labor")!;
    expect(two.unitCostCents - one.unitCostCents).toBe(rateCard.labor.twoStoryAddPerSquareCents);
  });

  it("scales tear-off labor by the per-layer multiplier (golden)", () => {
    // 1 layer => 5500; 2 layers => round(5500 * (1 + 0.7*1)) = round(9350) = 9350
    const oneLayer = lineFor(estimateRoofing(measurement({ existingLayers: 1 }), rateCard)[0], "tearoff_labor")!;
    const twoLayer = lineFor(estimateRoofing(measurement({ existingLayers: 2 }), rateCard)[0], "tearoff_labor")!;
    expect(oneLayer.unitCostCents).toBe(5500);
    expect(twoLayer.unitCostCents).toBe(9350);
  });
});
