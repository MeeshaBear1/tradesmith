/**
 * Tier-1 material / color "swatch board" — the permanent, deterministic, zero-AI
 * render fallback for the homeowner proposal. Real product lines and representative
 * colors per trade + tier; no image generation required. The eventual AI img2img
 * render (behind `hasKey("render")`) layers on top of this; the swatch board is what
 * guarantees the proposal is never an empty gray box.
 *
 * Honesty: colors are on-screen approximations — the UI always says
 * "actual finish may vary; ask for a physical sample."
 */

import type { Tier, Vertical } from "@/lib/takeoff/types";

export interface Swatch {
  name: string;
  hex: string;
}

export interface MaterialBoard {
  /** What the homeowner is choosing, e.g. "Architectural shingle". */
  material: string;
  /** Representative product line for credibility (not an endorsement). */
  brand: string;
  swatches: Swatch[];
}

type TierBoards = Partial<Record<Tier, MaterialBoard>>;

/**
 * Only trades with a meaningful visible finish get a board. Trades whose value is
 * not color-led (electrical, hvac, plumbing, solar, insulation, drywall, remodel)
 * return null and fall back to a project-summary panel.
 */
const CATALOG: Partial<Record<Vertical, TierBoards>> = {
  roofing: {
    good: {
      material: "3-tab asphalt shingle",
      brand: "GAF Royal Sovereign",
      swatches: [
        { name: "Charcoal", hex: "#3a3d40" },
        { name: "Weathered Wood", hex: "#6b5d4f" },
        { name: "Driftwood", hex: "#8a8071" },
        { name: "Slate", hex: "#5a6068" },
      ],
    },
    better: {
      material: "Architectural shingle",
      brand: "GAF Timberline HDZ",
      swatches: [
        { name: "Charcoal", hex: "#36393d" },
        { name: "Barkwood", hex: "#4b3f34" },
        { name: "Pewter Gray", hex: "#7d7f82" },
        { name: "Weathered Wood", hex: "#6d5e4c" },
        { name: "Hickory", hex: "#5a4a3a" },
      ],
    },
    best: {
      material: "Designer shingle",
      brand: "GAF Grand Sequoia / CertainTeed",
      swatches: [
        { name: "Stonewood", hex: "#4a4a4c" },
        { name: "Sablewood", hex: "#3b342d" },
        { name: "Black", hex: "#222426" },
        { name: "Slate Blend", hex: "#4f5560" },
        { name: "Hunter Green", hex: "#2f3d34" },
      ],
    },
  },
  siding: {
    good: {
      material: "Insulated vinyl siding",
      brand: "CertainTeed MainStreet",
      swatches: [
        { name: "Sterling Gray", hex: "#9aa0a3" },
        { name: "Sandstone Beige", hex: "#c9b79b" },
        { name: "Colonial White", hex: "#efece3" },
        { name: "Sage", hex: "#97a08c" },
        { name: "Cypress", hex: "#6f7d6b" },
      ],
    },
    better: {
      material: "Fiber-cement lap siding",
      brand: "James Hardie HardiePlank",
      swatches: [
        { name: "Iron Gray", hex: "#4c5054" },
        { name: "Aged Pewter", hex: "#8b8f91" },
        { name: "Boothbay Blue", hex: "#6a8390" },
        { name: "Arctic White", hex: "#f2f1ec" },
        { name: "Khaki Brown", hex: "#8a7a64" },
      ],
    },
    best: {
      material: "Premium fiber-cement + trim",
      brand: "James Hardie Statement",
      swatches: [
        { name: "Deep Ocean", hex: "#2f4858" },
        { name: "Countrylane Red", hex: "#7e3b32" },
        { name: "Evening Blue", hex: "#34404d" },
        { name: "Pearl Gray", hex: "#c7c8c6" },
        { name: "Rich Espresso", hex: "#45382e" },
      ],
    },
  },
  windows: {
    good: {
      material: "Vinyl double-hung",
      brand: "Builder series",
      swatches: [
        { name: "White", hex: "#f4f3ef" },
        { name: "Almond", hex: "#e6ddca" },
      ],
    },
    better: {
      material: "Vinyl, exterior color",
      brand: "Pella / ProVia",
      swatches: [
        { name: "Black", hex: "#232527" },
        { name: "Bronze", hex: "#4b3f31" },
        { name: "Clay", hex: "#cdbfa6" },
        { name: "White", hex: "#f4f3ef" },
      ],
    },
    best: {
      material: "Clad-wood",
      brand: "Andersen 400 Series",
      swatches: [
        { name: "Dark Bronze", hex: "#3a342c" },
        { name: "Black", hex: "#1f2123" },
        { name: "Forest Green", hex: "#2c3a2f" },
        { name: "Canvas", hex: "#e9e3d4" },
      ],
    },
  },
  gutters: {
    good: {
      material: "Seamless aluminum, 5\"",
      brand: "Standard K-style",
      swatches: [
        { name: "White", hex: "#f2f1ec" },
        { name: "Almond", hex: "#e6ddc9" },
      ],
    },
    better: {
      material: "Seamless aluminum, 6\"",
      brand: "Oversized K-style",
      swatches: [
        { name: "Royal Brown", hex: "#4a3528" },
        { name: "Musket Brown", hex: "#5a4a3a" },
        { name: "Linen", hex: "#ded6c4" },
        { name: "White", hex: "#f2f1ec" },
      ],
    },
    best: {
      material: "Aluminum + leaf guard",
      brand: "Premium + gutter guard",
      swatches: [
        { name: "Black", hex: "#232527" },
        { name: "Bronze", hex: "#463a2c" },
        { name: "Hunter Green", hex: "#2f3d34" },
        { name: "Copper-tone", hex: "#9c6b3f" },
      ],
    },
  },
  painting: {
    good: {
      material: "Exterior body color",
      brand: "Sherwin-Williams SuperPaint",
      swatches: [
        { name: "Pure White", hex: "#efeee6" },
        { name: "Agreeable Gray", hex: "#d1c7b8" },
        { name: "Repose Gray", hex: "#c8c4bb" },
      ],
    },
    better: {
      material: "Body + accent color",
      brand: "Sherwin-Williams Duration",
      swatches: [
        { name: "Naval", hex: "#2b3b53" },
        { name: "Iron Ore", hex: "#434341" },
        { name: "Dovetail", hex: "#8c8378" },
        { name: "Evergreen Fog", hex: "#95988d" },
      ],
    },
    best: {
      material: "Full repaint + trim",
      brand: "Sherwin-Williams Emerald",
      swatches: [
        { name: "Tricorn Black", hex: "#2a2a2c" },
        { name: "Urbane Bronze", hex: "#54504a" },
        { name: "Cyberspace", hex: "#45494d" },
        { name: "Rookwood Red", hex: "#6e3b34" },
      ],
    },
  },
  fencing: {
    good: {
      material: "Pressure-treated pine",
      brand: "Standard picket/privacy",
      swatches: [
        { name: "Natural Pine", hex: "#c2a878" },
        { name: "Cedar Tone", hex: "#a6764b" },
      ],
    },
    better: {
      material: "Western red cedar",
      brand: "Cedar / redwood",
      swatches: [
        { name: "Western Red Cedar", hex: "#9b5f3b" },
        { name: "Redwood", hex: "#7e4a35" },
        { name: "Driftwood Gray", hex: "#8e857a" },
      ],
    },
    best: {
      material: "Composite / vinyl",
      brand: "Trex / premium vinyl",
      swatches: [
        { name: "White Vinyl", hex: "#f1f0ea" },
        { name: "Walnut Composite", hex: "#5a4634" },
        { name: "Slate Composite", hex: "#565b5e" },
      ],
    },
  },
  decking: {
    good: {
      material: "Pressure-treated deck",
      brand: "Standard PT lumber",
      swatches: [
        { name: "Natural", hex: "#b79a6e" },
        { name: "Cedar", hex: "#9a6b43" },
      ],
    },
    better: {
      material: "Composite decking",
      brand: "Trex Enhance",
      swatches: [
        { name: "Saddle", hex: "#7d5a3c" },
        { name: "Clam Shell", hex: "#cfc6b4" },
        { name: "Island Mist", hex: "#9a9a93" },
      ],
    },
    best: {
      material: "Premium composite",
      brand: "Trex Transcend",
      swatches: [
        { name: "Spiced Rum", hex: "#6e4326" },
        { name: "Tiki Torch", hex: "#8a4a2a" },
        { name: "Lava Rock", hex: "#3c3a38" },
        { name: "Havana Gold", hex: "#93653a" },
      ],
    },
  },
  flooring: {
    good: {
      material: "Luxury vinyl plank",
      brand: "LVP",
      swatches: [
        { name: "Oak Natural", hex: "#c8a877" },
        { name: "Greige", hex: "#b9ad9a" },
      ],
    },
    better: {
      material: "Engineered hardwood",
      brand: "Engineered oak",
      swatches: [
        { name: "Smoked Hickory", hex: "#8a6a47" },
        { name: "Weathered Gray", hex: "#9a948a" },
        { name: "Honey Oak", hex: "#c39a63" },
      ],
    },
    best: {
      material: "Wide-plank hardwood",
      brand: "Walnut / white oak",
      swatches: [
        { name: "Walnut", hex: "#5b4233" },
        { name: "Espresso", hex: "#41342a" },
        { name: "Chevron Oak", hex: "#b88f5d" },
        { name: "Whitewashed", hex: "#d8cdbb" },
      ],
    },
  },
  concrete: {
    good: {
      material: "Broom-finish concrete",
      brand: "Standard gray",
      swatches: [
        { name: "Natural Gray", hex: "#b8b7b2" },
        { name: "Charcoal", hex: "#6f7072" },
      ],
    },
    better: {
      material: "Stained concrete",
      brand: "Acid / water stain",
      swatches: [
        { name: "Tan Stain", hex: "#b39873" },
        { name: "Slate Stain", hex: "#5c5f63" },
        { name: "Coffee", hex: "#5a4636" },
      ],
    },
    best: {
      material: "Stamped / decorative",
      brand: "Stamped overlay",
      swatches: [
        { name: "Ashlar Slate", hex: "#6a6c6e" },
        { name: "Terracotta", hex: "#9c5b3f" },
        { name: "Sandstone", hex: "#c2a883" },
        { name: "Walnut Stamp", hex: "#5a4636" },
      ],
    },
  },
};

/** Returns the material board for a trade+tier, or null when finish isn't color-led. */
export function materialBoard(vertical: Vertical, tier: Tier): MaterialBoard | null {
  return CATALOG[vertical]?.[tier] ?? null;
}
