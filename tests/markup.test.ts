import { describe, it, expect } from "vitest";
import { applyMarkups, type MarkupConfig } from "@/lib/pricing/markup";

// The canonical Omniscient/Plansmith compounding stack the engine ships with.
const STACK: MarkupConfig[] = [
  { key: "gc", label: "General conditions", rate: 0.08 },
  { key: "op", label: "Overhead & profit", rate: 0.1 },
  { key: "contingency", label: "Contingency", rate: 0.05 },
  { key: "escalation", label: "Escalation", rate: 0.03 },
  { key: "bonds", label: "Bonds & insurance", rate: 0.02 },
];

describe("applyMarkups — compounding markup stack", () => {
  it("compounds each layer on the running subtotal (golden, base $100.00)", () => {
    // running = 10000
    //  gc:          round(10000 * 0.08) =  800 -> 10800
    //  op:          round(10800 * 0.10) = 1080 -> 11880
    //  contingency: round(11880 * 0.05) =  594 -> 12474
    //  escalation:  round(12474 * 0.03) =  374 -> 12848   (374.22 -> 374)
    //  bonds:       round(12848 * 0.02) =  257 -> 13105   (256.96 -> 257)
    const { totalCents, layers } = applyMarkups(10000, STACK);
    expect(totalCents).toBe(13105);
    expect(layers.map((l) => l.amountCents)).toEqual([800, 1080, 594, 374, 257]);
    expect(layers.map((l) => l.runningCents)).toEqual([10800, 11880, 12474, 12848, 13105]);
  });

  it("lands at ~1.31x gross markup on cost", () => {
    const { totalCents } = applyMarkups(1_000_000, STACK);
    const multiplier = totalCents / 1_000_000;
    expect(multiplier).toBeGreaterThan(1.3);
    expect(multiplier).toBeLessThan(1.32);
  });

  it("applies the regional factor to the base BEFORE markups (empty stack)", () => {
    // round(10000 * 1.5) = 15000, no layers applied
    const { totalCents, layers } = applyMarkups(10000, [], 1.5);
    expect(totalCents).toBe(15000);
    expect(layers).toEqual([]);
  });

  it("regional factor of 1 is the identity on the base", () => {
    expect(applyMarkups(8888, [], 1).totalCents).toBe(8888);
    expect(applyMarkups(8888, []).totalCents).toBe(8888); // default arg
  });

  it("a higher regional factor never lowers the total", () => {
    const low = applyMarkups(50000, STACK, 0.9).totalCents;
    const mid = applyMarkups(50000, STACK, 1.0).totalCents;
    const high = applyMarkups(50000, STACK, 1.3).totalCents;
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  it("emits only whole integer cents (no fractional money)", () => {
    const { totalCents, layers } = applyMarkups(123_457, STACK, 1.07);
    expect(Number.isInteger(totalCents)).toBe(true);
    for (const l of layers) {
      expect(Number.isInteger(l.amountCents)).toBe(true);
      expect(Number.isInteger(l.runningCents)).toBe(true);
    }
  });

  it("running subtotal is strictly increasing across positive-rate layers", () => {
    const { layers } = applyMarkups(40000, STACK);
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i].runningCents).toBeGreaterThan(layers[i - 1].runningCents);
    }
  });

  it("total is never below the regionally-adjusted base for a positive stack", () => {
    const base = 73210;
    const { totalCents } = applyMarkups(base, STACK);
    expect(totalCents).toBeGreaterThanOrEqual(base);
  });

  it("a zero base produces zero total and zero layers amounts", () => {
    const { totalCents, layers } = applyMarkups(0, STACK);
    expect(totalCents).toBe(0);
    expect(layers.every((l) => l.amountCents === 0)).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    const a = applyMarkups(99999, STACK, 1.11);
    const b = applyMarkups(99999, STACK, 1.11);
    expect(a).toEqual(b);
  });
});
