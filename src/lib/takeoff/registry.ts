import type { TakeoffEngine, Vertical } from "@/lib/takeoff/types";
import { roofingEngine } from "@/lib/takeoff/roofing";

/** Add a vertical = one entry here. No other code changes. */
const engines: Partial<Record<Vertical, TakeoffEngine>> = {
  roofing: roofingEngine,
  // electrical: electricalEngine,
  // hvac: hvacEngine,
  // gc: gcEngine,
};

export function getEngine(vertical: Vertical = "roofing"): TakeoffEngine {
  return engines[vertical] ?? roofingEngine;
}
