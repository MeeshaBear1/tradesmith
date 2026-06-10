import type { Vertical } from "@/lib/takeoff/types";
import type { VerticalConfig } from "@/lib/verticals/types";
import {
  concreteConfig,
  deckingConfig,
  drywallConfig,
  electricalConfig,
  fencingConfig,
  flooringConfig,
  guttersConfig,
  hvacConfig,
  insulationConfig,
  paintingConfig,
  plumbingConfig,
  remodelConfig,
  roofingConfig,
  sidingConfig,
  solarConfig,
  windowsConfig,
} from "@/lib/verticals/configs";

/** Every construction trade. Add one = add a config + one entry here. */
export const VERTICALS: Record<Vertical, VerticalConfig> = {
  roofing: roofingConfig,
  siding: sidingConfig,
  gutters: guttersConfig,
  windows: windowsConfig,
  remodel: remodelConfig,
  electrical: electricalConfig,
  hvac: hvacConfig,
  plumbing: plumbingConfig,
  solar: solarConfig,
  painting: paintingConfig,
  concrete: concreteConfig,
  fencing: fencingConfig,
  decking: deckingConfig,
  insulation: insulationConfig,
  drywall: drywallConfig,
  flooring: flooringConfig,
};

export const VERTICAL_LIST: VerticalConfig[] = Object.values(VERTICALS);

export function getVertical(key: Vertical): VerticalConfig {
  return VERTICALS[key] ?? roofingConfig;
}

export function isVertical(key: string): key is Vertical {
  return key in VERTICALS;
}
