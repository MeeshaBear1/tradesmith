import { describe, it, expect } from "vitest";
import { recomputeTier, sanitizeLineItems, RATE_CEILING_CENTS } from "@/lib/estimate/edit";
import { estimateVertical, defaultInputs } from "@/lib/verticals/engine";
import { getVertical } from "@/lib/verticals/registry";
import { estimateFromScope } from "@/lib/scope/estimate";
import { templateScope } from "@/lib/scope/catalog";

describe("sanitizeLineItems — untrusted edit rows", () => {
  it("clamps quantity, clamps unit cost to the $50k ceiling, and recomputes line cost", () => {
    const [item] = sanitizeLineItems([
      { key: "x", category: "material", description: "Tile", quantity: 12.5, unit: "sq ft", unitCostCents: 1100 },
    ]);
    expect(item.quantity).toBe(12.5);
    expect(item.unitCostCents).toBe(1100);
    expect(item.lineCostCents).toBe(Math.round(12.5 * 1100));

    const [over] = sanitizeLineItems([{ description: "x", quantity: 1, unitCostCents: 9_999_999 }]);
    expect(over.unitCostCents).toBe(RATE_CEILING_CENTS);
    expect(RATE_CEILING_CENTS).toBe(5_000_000);
  });

  it("drops zero / negative quantity rows (the delete gesture)", () => {
    const items = sanitizeLineItems([
      { description: "keep", quantity: 3, unitCostCents: 100 },
      { description: "gone", quantity: 0, unitCostCents: 100 },
      { description: "neg", quantity: -5, unitCostCents: 100 },
    ]);
    expect(items.map((i) => i.description)).toEqual(["keep"]);
  });

  it("defaults a bad category to material and coerces numeric strings", () => {
    const [item] = sanitizeLineItems([
      { category: "teleport", description: "Odd", quantity: "4", unit: "", unitCostCents: "250" },
    ]);
    expect(item.category).toBe("material");
    expect(item.quantity).toBe(4);
    expect(item.unitCostCents).toBe(250);
    expect(item.unit).toBe("ea");
  });

  it("tolerates non-array / empty input", () => {
    expect(sanitizeLineItems(null)).toEqual([]);
    expect(sanitizeLineItems(undefined)).toEqual([]);
    expect(sanitizeLineItems("nope")).toEqual([]);
    expect(sanitizeLineItems([])).toEqual([]);
  });
});

describe("recomputeTier — re-derive a tier from edited items", () => {
  const remodel = getVertical("remodel");
  const tier = estimateVertical(remodel, defaultInputs(remodel))[1]; // a real "better" tier

  it("an unchanged edit reproduces the original money exactly (round-trip)", () => {
    const same = recomputeTier(tier, tier.lineItems, remodel.regionalFactor);
    expect(same.baseCents).toBe(tier.baseCents);
    expect(same.materialCents).toBe(tier.materialCents);
    expect(same.laborCents).toBe(tier.laborCents);
    expect(same.totalCents).toBe(tier.totalCents);
    expect(same.markup.length).toBe(tier.markup.length);
  });

  it("base = sum of category buckets, and the markup stack lifts base to total", () => {
    const edited = sanitizeLineItems([
      { key: "demo", category: "labor", description: "Demolition", quantity: 200, unit: "sq ft", unitCostCents: 1500 },
      { key: "extra", category: "fee", description: "Dust barrier", quantity: 1, unit: "project", unitCostCents: 50000 },
    ]);
    const t = recomputeTier(tier, edited, remodel.regionalFactor);
    expect(t.baseCents).toBe(t.materialCents + t.laborCents + t.disposalCents + t.feeCents);
    expect(t.laborCents).toBe(Math.round(200 * 1500));
    expect(t.feeCents).toBe(50000);
    expect(t.totalCents).toBeGreaterThan(t.baseCents);
  });

  it("adding a line raises the total; removing one lowers it", () => {
    const base = recomputeTier(tier, tier.lineItems, remodel.regionalFactor);
    const plus = recomputeTier(
      tier,
      [...tier.lineItems, { key: "addon", category: "fee", description: "Permit expedite", quantity: 1, unit: "ea", unitCostCents: 40000, lineCostCents: 40000 }],
      remodel.regionalFactor,
    );
    expect(plus.totalCents).toBeGreaterThan(base.totalCents);
    const minus = recomputeTier(tier, tier.lineItems.slice(1), remodel.regionalFactor);
    expect(minus.totalCents).toBeLessThan(base.totalCents);
  });

  it("works on a photo-scoped tier (the editor's primary use case)", () => {
    const scoped = estimateFromScope(templateScope("bathroom", "framed", 48).items, { displayQty: 48 })[1];
    const edited = sanitizeLineItems(
      scoped.lineItems.map((li) => (li.key === "toilet" ? { ...li, unitCostCents: 120000 } : li)),
    );
    const t = recomputeTier(scoped, edited, 1);
    const toilet = t.lineItems.find((l) => l.key === "toilet")!;
    expect(toilet.unitCostCents).toBe(120000);
    expect(t.totalCents).toBeGreaterThan(0);
    expect(t.baseCents).toBe(t.materialCents + t.laborCents + t.disposalCents + t.feeCents);
  });
});
