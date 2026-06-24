import { describe, it, expect } from "vitest";
import { VERTICAL_LIST, VERTICALS, getVertical, isVertical } from "@/lib/verticals/registry";
import {
  estimateVertical,
  resolveRate,
  sanitizeInputs,
  defaultInputs,
} from "@/lib/verticals/engine";
import type { RateValue, VerticalConfig } from "@/lib/verticals/types";

const FORM_VERTICALS = VERTICAL_LIST.filter((c) => c.measurementMode === "form");

const isTiered = (rv: RateValue): rv is { good: number; better: number; best: number } =>
  typeof rv === "object";

describe("vertical registry — config invariants", () => {
  it("registers exactly 16 trades with unique keys", () => {
    expect(VERTICAL_LIST.length).toBe(16);
    const keys = VERTICAL_LIST.map((c) => c.key);
    expect(new Set(keys).size).toBe(16);
  });

  it("only roofing uses AI measurement; the other 15 are form-based", () => {
    expect(getVertical("roofing").measurementMode).toBe("ai");
    expect(FORM_VERTICALS.length).toBe(15);
  });

  it("isVertical guards unknown keys", () => {
    expect(isVertical("roofing")).toBe(true);
    expect(isVertical("teleportation")).toBe(false);
  });

  it("every config is well-formed and self-consistent", () => {
    for (const c of VERTICAL_LIST) {
      expect(c.key in VERTICALS).toBe(true);
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.unitLabel.length).toBeGreaterThan(0);
      expect(c.fields.length).toBeGreaterThan(0);
      expect(c.markupStack.length).toBeGreaterThan(0);
      expect(typeof c.regionalFactor).toBe("number");
      // the primary quantity must be one of the declared fields
      expect(c.fields.some((f) => f.key === c.primaryQuantityKey)).toBe(true);
    }
  });

  it("every tiered seed rate is ascending (Good <= Better <= Best)", () => {
    for (const c of VERTICAL_LIST) {
      for (const [key, rv] of Object.entries(c.rates)) {
        if (isTiered(rv)) {
          expect(rv.good, `${c.key}.${key}`).toBeLessThanOrEqual(rv.better);
          expect(rv.better, `${c.key}.${key}`).toBeLessThanOrEqual(rv.best);
        }
      }
    }
  });

  it("every form trade declares at least one line and a rate for each line key", () => {
    for (const c of FORM_VERTICALS) {
      expect(c.lines.length).toBeGreaterThan(0);
      for (const ln of c.lines) {
        const rateKey = ln.rateKey ?? ln.key;
        expect(c.rates[rateKey], `${c.key}.${rateKey}`).toBeDefined();
      }
    }
  });
});

describe("engine helpers", () => {
  it("resolveRate handles flat, tiered, and missing rates", () => {
    expect(resolveRate(500, "best")).toBe(500);
    expect(resolveRate({ good: 1, better: 2, best: 3 }, "better")).toBe(2);
    expect(resolveRate(undefined, "good")).toBe(0);
    expect(resolveRate(undefined, "good", 99)).toBe(99);
  });

  it("sanitizeInputs clamps numbers to field bounds and rejects bad selects", () => {
    const siding = getVertical("siding");
    const cleaned = sanitizeInputs(siding, {
      wallSqft: 999999, // above max 20000 -> clamp
      stories: -3, // below min 1 -> clamp
      removeExisting: "maybe", // not an allowed option -> default
      openings: "8" as unknown as number, // numeric string -> coerced
    });
    expect(cleaned.wallSqft).toBe(20000);
    expect(cleaned.stories).toBe(1);
    expect(cleaned.removeExisting).toBe("yes"); // the field default
    expect(cleaned.openings).toBe(8);
  });

  it("sanitizeInputs falls back to the field default for non-numeric numbers", () => {
    const siding = getVertical("siding");
    const cleaned = sanitizeInputs(siding, { wallSqft: "not-a-number" as unknown as number });
    expect(cleaned.wallSqft).toBe(1800); // siding wallSqft default
  });

  it("defaultInputs returns each field's declared default", () => {
    const di = defaultInputs(getVertical("windows"));
    expect(di.windowCount).toBe(10);
    expect(di.removeExisting).toBe("yes");
  });
});

describe("estimateVertical — every form trade prices cleanly on defaults", () => {
  for (const c of FORM_VERTICALS) {
    it(`${c.key}: 3 ordered tiers, positive integer cents, numbers tie out`, () => {
      const tiers = estimateVertical(c, defaultInputs(c));
      expect(tiers.map((t) => t.tier)).toEqual(["good", "better", "best"]);

      for (const t of tiers) {
        expect(t.totalCents).toBeGreaterThan(0);
        expect(Number.isInteger(t.totalCents)).toBe(true);
        expect(Number.isInteger(t.baseCents)).toBe(true);
        // base = sum of the four category buckets
        expect(t.baseCents).toBe(t.materialCents + t.laborCents + t.disposalCents + t.feeCents);
        // markup lifts base to total
        expect(t.totalCents).toBeGreaterThanOrEqual(t.baseCents);
        // each line cost ties to round(qty * unit)
        for (const li of t.lineItems) {
          expect(li.lineCostCents).toBe(Math.round(li.quantity * li.unitCostCents));
          expect(Number.isInteger(li.unitCostCents)).toBe(true);
        }
      }

      // Good <= Better <= Best (richer tiers never cost less)
      expect(tiers[0].totalCents).toBeLessThanOrEqual(tiers[1].totalCents);
      expect(tiers[1].totalCents).toBeLessThanOrEqual(tiers[2].totalCents);
    });
  }
});

describe("estimateVertical — behavior", () => {
  const siding = getVertical("siding");

  it("drops conditional zero-quantity lines (no 2-story line on a 1-story job)", () => {
    const oneStory = estimateVertical(siding, { ...defaultInputs(siding), stories: 1 })[0];
    const twoStory = estimateVertical(siding, { ...defaultInputs(siding), stories: 2 })[0];
    expect(oneStory.lineItems.some((l) => l.key === "twostory")).toBe(false);
    expect(twoStory.lineItems.some((l) => l.key === "twostory")).toBe(true);
    expect(twoStory.totalCents).toBeGreaterThan(oneStory.totalCents);
  });

  it("a rate override changes the unit cost for that line", () => {
    const base = estimateVertical(siding, defaultInputs(siding))[2];
    const bumped = estimateVertical(siding, defaultInputs(siding), {
      rates: { install: { good: 300, better: 380, best: 9999 } },
    })[2];
    const baseInstall = base.lineItems.find((l) => l.key === "install")!;
    const bumpedInstall = bumped.lineItems.find((l) => l.key === "install")!;
    expect(bumpedInstall.unitCostCents).toBe(9999);
    expect(bumpedInstall.unitCostCents).toBeGreaterThan(baseInstall.unitCostCents);
  });

  it("a higher regional factor scales the whole estimate up", () => {
    const normal = estimateVertical(siding, defaultInputs(siding), { regionalFactor: 1 })[1];
    const pricey = estimateVertical(siding, defaultInputs(siding), { regionalFactor: 1.5 })[1];
    expect(pricey.totalCents).toBeGreaterThan(normal.totalCents);
  });

  it("is deterministic for identical inputs", () => {
    expect(estimateVertical(siding, defaultInputs(siding))).toEqual(
      estimateVertical(siding, defaultInputs(siding)),
    );
  });

  it("never emits negative quantities even from absurd inputs", () => {
    const tiers = estimateVertical(siding, { wallSqft: -5000, stories: 1, openings: -10, removeExisting: "no" });
    for (const t of tiers) {
      for (const li of t.lineItems) expect(li.quantity).toBeGreaterThanOrEqual(0);
      expect(t.totalCents).toBeGreaterThanOrEqual(0);
    }
  });
});

// Help the type-checker: the unused import guard above keeps VerticalConfig meaningful.
const _typeGuard: VerticalConfig | undefined = undefined;
void _typeGuard;
