import { describe, it, expect } from "vitest";
import {
  RATE_CEILING_CENTS,
  clampCents,
  clampRegionalFactor,
  cleanAgainstSeed,
  sanitizeRateConfig,
} from "@/lib/verticals/rate-overrides";

describe("clampCents / RATE_CEILING_CENTS", () => {
  it("rounds and clamps to [0, $50,000]", () => {
    expect(RATE_CEILING_CENTS).toBe(5_000_000);
    expect(clampCents(123.7)).toBe(124);
    expect(clampCents(-50)).toBe(0);
    expect(clampCents(9_999_999)).toBe(5_000_000);
    expect(clampCents(5_000_000)).toBe(5_000_000); // boundary exact
  });
});

describe("clampRegionalFactor", () => {
  it("clamps to the 0.5x–2.5x band, defaulting to 1", () => {
    expect(clampRegionalFactor(1.2)).toBe(1.2);
    expect(clampRegionalFactor(0.4)).toBe(0.5);
    expect(clampRegionalFactor(3)).toBe(2.5);
    expect(clampRegionalFactor(0.5)).toBe(0.5); // boundary
    expect(clampRegionalFactor(2.5)).toBe(2.5); // boundary
    expect(clampRegionalFactor("nope")).toBe(1);
    expect(clampRegionalFactor(undefined)).toBe(1);
    expect(clampRegionalFactor(Number.NaN)).toBe(1);
  });
});

describe("cleanAgainstSeed — validate one value against its seed shape", () => {
  it("drops a key with no seed (unknown rateKey)", () => {
    expect(cleanAgainstSeed(undefined, 123)).toBeNull();
  });

  describe("flat seed (e.g. siding.housewrap = 45)", () => {
    const seed = 45;
    it("accepts and clamps a finite number", () => {
      expect(cleanAgainstSeed(seed, 100)).toBe(100);
      expect(cleanAgainstSeed(seed, 9_999_999)).toBe(5_000_000);
      expect(cleanAgainstSeed(seed, -10)).toBe(0);
      expect(cleanAgainstSeed(seed, 12.6)).toBe(13);
    });
    it("rejects a tiered object, strings, and non-finite numbers", () => {
      expect(cleanAgainstSeed(seed, { good: 1, better: 2, best: 3 })).toBeNull();
      expect(cleanAgainstSeed(seed, "200")).toBeNull();
      expect(cleanAgainstSeed(seed, Number.NaN)).toBeNull();
      expect(cleanAgainstSeed(seed, Number.POSITIVE_INFINITY)).toBeNull();
    });
  });

  describe("tiered seed (e.g. siding.siding = {250,500,850})", () => {
    const seed = { good: 250, better: 500, best: 850 };
    it("accepts a full triple and sorts it ascending", () => {
      expect(cleanAgainstSeed(seed, { good: 900, better: 500, best: 850 })).toEqual({
        good: 500,
        better: 850,
        best: 900,
      });
    });
    it("clamps each tier value", () => {
      expect(cleanAgainstSeed(seed, { good: -5, better: 600, best: 9_999_999 })).toEqual({
        good: 0,
        better: 600,
        best: 5_000_000,
      });
    });
    it("rejects a partial, scalar, non-numeric, or null triple", () => {
      expect(cleanAgainstSeed(seed, { good: 1, better: 2 })).toBeNull();
      expect(cleanAgainstSeed(seed, 500)).toBeNull();
      expect(cleanAgainstSeed(seed, { good: "1", better: 2, best: 3 })).toBeNull();
      expect(cleanAgainstSeed(seed, null)).toBeNull();
    });
  });
});

describe("sanitizeRateConfig — full untrusted-body sanitization", () => {
  it("rejects roofing overrides (roofing is geometry-priced)", () => {
    const cfg = sanitizeRateConfig({ rates: { roofing: { anything: 100 } } });
    expect(cfg.rates.roofing).toBeUndefined();
  });

  it("drops unknown trades and unknown rate keys, keeps valid ones", () => {
    const cfg = sanitizeRateConfig({
      rates: {
        teleportation: { foo: 100 },
        siding: { not_a_real_key: 100, install: { good: 300, better: 380, best: 520 } },
      },
    });
    expect(cfg.rates.teleportation).toBeUndefined();
    expect(cfg.rates.siding).toEqual({ install: { good: 300, better: 380, best: 520 } });
  });

  it("corrects an inverted tier triple so Good <= Better <= Best", () => {
    const cfg = sanitizeRateConfig({
      rates: { siding: { install: { good: 520, better: 300, best: 380 } } },
    });
    expect(cfg.rates.siding.install).toEqual({ good: 300, better: 380, best: 520 });
  });

  it("clamps an overflow attempt to the ceiling", () => {
    const cfg = sanitizeRateConfig({ rates: { siding: { housewrap: 99_999_999 } } });
    expect(cfg.rates.siding.housewrap).toBe(5_000_000);
  });

  it("clamps the regional factor and defaults a missing one", () => {
    expect(sanitizeRateConfig({ regionalFactor: 9 }).regionalFactor).toBe(2.5);
    expect(sanitizeRateConfig({ regionalFactor: 0.1 }).regionalFactor).toBe(0.5);
    expect(sanitizeRateConfig({}).regionalFactor).toBe(1);
  });

  it("only persists trades that end up with at least one valid override", () => {
    const cfg = sanitizeRateConfig({ rates: { siding: { not_a_real_key: 100 } } });
    expect(cfg.rates.siding).toBeUndefined();
  });

  it("tolerates a null/empty body", () => {
    expect(sanitizeRateConfig(null)).toEqual({ regionalFactor: 1, rates: {} });
    expect(sanitizeRateConfig(undefined)).toEqual({ regionalFactor: 1, rates: {} });
  });
});
