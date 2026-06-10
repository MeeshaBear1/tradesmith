import type { MarkupLayer } from "@/lib/takeoff/types";

export interface MarkupConfig {
  key: string;
  label: string;
  rate: number;
}

/**
 * Omniscient/Plansmith-style compounding markup stack.
 * Each layer compounds on the running subtotal (the defensible reading of GC
 * accounting): 1.08 * 1.10 * 1.05 * 1.03 * 1.02 ≈ 1.31x gross markup on cost.
 * A regional factor is applied to the base before markups.
 */
export function applyMarkups(
  baseCents: number,
  stack: MarkupConfig[],
  regionalFactor = 1,
): { totalCents: number; layers: MarkupLayer[] } {
  let running = Math.round(baseCents * regionalFactor);
  const layers: MarkupLayer[] = [];
  for (const m of stack) {
    const amountCents = Math.round(running * m.rate);
    running += amountCents;
    layers.push({ key: m.key, label: m.label, rate: m.rate, amountCents, runningCents: running });
  }
  return { totalCents: running, layers };
}
