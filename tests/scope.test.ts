import { describe, it, expect } from "vitest";
import { templateScope } from "@/lib/scope/catalog";
import { estimateFromScope, scopeLineItemsForTier } from "@/lib/scope/estimate";
import { confidenceBand, CURRENT_STATES, ROOM_TYPES } from "@/lib/scope/types";
import type { ScopeLineSeed } from "@/lib/scope/types";

describe("templateScope — grounded room finish templates", () => {
  it("produces a non-empty, well-formed scope for every room type (framed)", () => {
    for (const room of ROOM_TYPES) {
      const s = templateScope(room, "framed", 120);
      expect(s.items.length).toBeGreaterThan(0);
      expect(s.source).toBe("template");
      expect(s.vertical).toBe("remodel");
      for (const it of s.items) {
        expect(it.quantity).toBeGreaterThan(0);
        expect(["material", "labor", "equipment", "fee"]).toContain(it.category);
        expect(it.description.length).toBeGreaterThan(0);
      }
    }
  });

  it("a framed bathroom includes drywall + tile + fixtures; a drywalled one drops the board work", () => {
    const framed = templateScope("bathroom", "framed", 48);
    const drywalled = templateScope("bathroom", "drywalled", 48);
    const keys = (s: typeof framed) => new Set(s.items.map((i) => i.key));
    expect(keys(framed).has("cement_drywall")).toBe(true);
    expect(keys(framed).has("tile_setting")).toBe(true);
    expect(keys(framed).has("toilet")).toBe(true);
    // drywalled: board work already done
    expect(keys(drywalled).has("cement_drywall")).toBe(false);
    expect(keys(drywalled).has("insulation")).toBe(false);
    // but tile + fixtures still remain
    expect(keys(drywalled).has("tile_setting")).toBe(true);
    expect(drywalled.items.length).toBeLessThan(framed.items.length);
  });

  it("a cosmetic refresh is a strict, lighter subset", () => {
    const framed = templateScope("room", "framed", 150);
    const cosmetic = templateScope("room", "cosmetic", 150);
    expect(cosmetic.items.length).toBeLessThan(framed.items.length);
    expect(cosmetic.items.some((i) => i.key === "paint")).toBe(true);
    expect(cosmetic.items.some((i) => i.key === "cement_drywall")).toBe(false);
  });

  it("scales quantities with floor area", () => {
    const small = templateScope("bathroom", "framed", 40);
    const big = templateScope("bathroom", "framed", 120);
    const floor = (s: typeof small) => s.items.find((i) => i.key === "floor_tile_mat")!.quantity;
    expect(floor(big)).toBeGreaterThan(floor(small));
  });
});

describe("estimateFromScope — pricing a scope into Good/Better/Best", () => {
  const scope = templateScope("bathroom", "framed", 48);

  it("returns three ordered tiers with positive integer cents that tie out", () => {
    const tiers = estimateFromScope(scope.items, { displayQty: 48 });
    expect(tiers.map((t) => t.tier)).toEqual(["good", "better", "best"]);
    for (const t of tiers) {
      expect(t.totalCents).toBeGreaterThan(0);
      expect(Number.isInteger(t.totalCents)).toBe(true);
      expect(Number.isInteger(t.baseCents)).toBe(true);
      expect(t.baseCents).toBe(t.materialCents + t.laborCents + t.disposalCents + t.feeCents);
      expect(t.totalCents).toBeGreaterThan(t.baseCents); // markup lifts base
      for (const li of t.lineItems) {
        expect(li.lineCostCents).toBe(Math.round(li.quantity * li.unitCostCents));
        expect(Number.isInteger(li.unitCostCents)).toBe(true);
      }
    }
  });

  it("richer tiers never cost less (good <= better <= best)", () => {
    const [good, better, best] = estimateFromScope(scope.items, { displayQty: 48 });
    expect(good.totalCents).toBeLessThanOrEqual(better.totalCents);
    expect(better.totalCents).toBeLessThanOrEqual(best.totalCents);
  });

  it("lands in a realistic band for a framed 48 sq ft bathroom", () => {
    const [good, , best] = estimateFromScope(scope.items, { displayQty: 48 });
    // A framed-to-finished small bathroom is roughly $8k–$30k depending on finish.
    expect(good.totalCents).toBeGreaterThan(700_000);
    expect(best.totalCents).toBeLessThan(3_500_000);
  });

  it("applies the regional factor", () => {
    const normal = estimateFromScope(scope.items, { displayQty: 48, regionalFactor: 1 })[1];
    const pricey = estimateFromScope(scope.items, { displayQty: 48, regionalFactor: 1.4 })[1];
    expect(pricey.totalCents).toBeGreaterThan(normal.totalCents);
  });

  it("drops zero/negative-quantity seeds", () => {
    const seeds: ScopeLineSeed[] = [
      { key: "a", category: "material", description: "Real", quantity: 10, unit: "sq ft", unitCost: 500 },
      { key: "b", category: "labor", description: "Zero", quantity: 0, unit: "ea", unitCost: 9000 },
      { key: "c", category: "fee", description: "Neg", quantity: -3, unit: "ea", unitCost: 9000 },
    ];
    const items = scopeLineItemsForTier(seeds, "better");
    expect(items.map((i) => i.key)).toEqual(["a"]);
  });

  it("is deterministic", () => {
    expect(estimateFromScope(scope.items, { displayQty: 48 })).toEqual(
      estimateFromScope(scope.items, { displayQty: 48 }),
    );
  });
});

describe("confidenceBand", () => {
  it("maps 0..1 to high/medium/low", () => {
    expect(confidenceBand(0.9)).toBe("high");
    expect(confidenceBand(0.7)).toBe("high");
    expect(confidenceBand(0.5)).toBe("medium");
    expect(confidenceBand(0.45)).toBe("medium");
    expect(confidenceBand(0.2)).toBe("low");
  });
});

describe("CURRENT_STATES sanity", () => {
  it("every state yields a priceable scope for a bathroom", () => {
    for (const st of CURRENT_STATES) {
      const tiers = estimateFromScope(templateScope("bathroom", st, 48).items, { displayQty: 48 });
      expect(tiers[0].totalCents).toBeGreaterThan(0);
    }
  });
});
