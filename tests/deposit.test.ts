import { describe, it, expect } from "vitest";
import {
  DEPOSIT_PCT,
  depositCents,
  resolveChosenTier,
  deriveAmountCents,
} from "@/lib/proposals/deposit";
import type { Tier } from "@/lib/takeoff/types";

const tiers = [
  { tier: "good" as Tier, totalCents: 1_000_000 },
  { tier: "better" as Tier, totalCents: 1_500_000 },
  { tier: "best" as Tier, totalCents: 2_200_000 },
];

describe("depositCents", () => {
  it("is 35% of the total", () => {
    expect(DEPOSIT_PCT).toBe(0.35);
    expect(depositCents(1_000_000)).toBe(350_000);
  });

  it("rounds to whole cents", () => {
    expect(depositCents(10001)).toBe(3500); // 3500.35 -> 3500
    expect(depositCents(3)).toBe(1); // 1.05 -> 1
    expect(Number.isInteger(depositCents(987654))).toBe(true);
  });

  it("is zero for a zero total", () => {
    expect(depositCents(0)).toBe(0);
  });
});

describe("resolveChosenTier — tier allow-list", () => {
  it("honors a valid requested tier that exists in the estimate", () => {
    expect(resolveChosenTier("best", tiers)).toBe("best");
  });

  it("ignores a real tier name that is not present in THIS estimate", () => {
    expect(resolveChosenTier("best", [{ tier: "good" as Tier }], "good")).toBe("good");
  });

  it("rejects an arbitrary non-tier string", () => {
    expect(resolveChosenTier("platinum", tiers, "better")).toBe("better");
  });

  it("falls back when nothing is requested", () => {
    expect(resolveChosenTier(undefined, tiers, "good")).toBe("good");
  });

  it("defaults the fallback to 'better'", () => {
    expect(resolveChosenTier(undefined, tiers)).toBe("better");
  });
});

describe("deriveAmountCents — server re-derivation (never trust the client)", () => {
  it("returns the chosen tier's own total", () => {
    expect(deriveAmountCents(tiers, "better")).toBe(1_500_000);
    expect(deriveAmountCents(tiers, "best")).toBe(2_200_000);
  });

  it("falls back to the provided total when the tier is missing", () => {
    expect(deriveAmountCents([{ tier: "good" as Tier, totalCents: 5 }], "best", 999)).toBe(999);
  });

  it("returns 0 by default when nothing matches", () => {
    expect(deriveAmountCents(undefined, "good")).toBe(0);
  });

  it("end-to-end: a forged tier cannot inflate the deposit above the real tier", () => {
    // Homeowner asks for "best" but only "good" exists in this estimate.
    const available = [{ tier: "good" as Tier }];
    const chosen = resolveChosenTier("best", available, "good");
    const total = deriveAmountCents(tiers.filter((t) => t.tier === "good"), chosen, 0);
    expect(chosen).toBe("good");
    // 35% of the GOOD total (1,000,000), never the best total (2,200,000)
    expect(depositCents(total)).toBe(350_000);
  });
});
