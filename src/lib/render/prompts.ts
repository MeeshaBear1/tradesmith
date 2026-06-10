/**
 * Identity-preserving img2img prompt builder. The whole risk of an AI render in a
 * bonded trade is over-promising, so the prompt is engineered to edit ONLY the trade
 * surface and keep everything else pixel-identical — never to beautify or invent
 * dormers, rooflines, or landscaping.
 */

import type { Vertical } from "@/lib/takeoff/types";

/** Only trades with an editable exterior surface can be rendered. */
const SURFACE: Partial<Record<Vertical, string>> = {
  roofing: "roof shingles",
  siding: "exterior siding",
  painting: "exterior wall paint",
  windows: "windows",
  gutters: "gutters and downspouts",
  fencing: "fence",
  decking: "deck surface",
  concrete: "concrete surface",
};

export function renderableVertical(vertical: Vertical): boolean {
  return vertical in SURFACE;
}

export function buildHouseEditPrompt(vertical: Vertical, material: string, color: string): string {
  const surface = SURFACE[vertical] ?? "exterior";
  return [
    `Photorealistically edit ONLY the ${surface} of this house to ${material} in a ${color} finish.`,
    `Keep the building structure, rooflines, windows, doors, landscaping, driveway, sky and the exact camera angle pixel-identical to the original.`,
    `Do not add, remove, or move any architectural feature. Match the original lighting and shadows.`,
    `Return a single photorealistic image of the same house with only the ${surface} changed.`,
  ].join(" ");
}
