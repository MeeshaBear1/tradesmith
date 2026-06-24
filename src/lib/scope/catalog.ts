import type { ScopeLineSeed, CurrentState, RoomType, ScopeResult } from "@/lib/scope/types";
import { confidenceBand } from "@/lib/scope/types";
import type { RateValue } from "@/lib/verticals/types";

/**
 * Grounded "finish this room" templates. These do two jobs:
 *  1. The zero-key fallback — the whole app runs with no secrets, so a contractor
 *     who snaps a framed bathroom still gets a realistic, editable line-item quote.
 *  2. The reference scope the AI vision pass is asked to adjust, not invent from
 *     scratch, so prices stay grounded in real construction line items.
 *
 * Quantities scale with floor area; unit costs (cents) vary by Good/Better/Best
 * finish quality. Every number is a sane default the contractor is expected to
 * confirm against their own pricing.
 */

const t = (good: number, better: number, best: number): RateValue => ({ good, better, best });
const round = (n: number) => Math.max(0, Math.round(n));

/** Wall+ceiling board area for a room of `floorSqft` (rough 8' ceilings). */
function boardArea(floorSqft: number): number {
  const side = Math.sqrt(Math.max(20, floorSqft));
  const wall = side * 4 * 8; // 4 walls * 8ft
  return round(wall + floorSqft);
}

// ----------------------------- BATHROOM -----------------------------

function bathroomSeeds(floorSqft: number): ScopeLineSeed[] {
  const F = Math.max(20, round(floorSqft));
  const board = boardArea(F);
  const showerWall = 90; // typical tub/shower surround tile area
  const tiled = F + showerWall;
  return [
    { key: "insulation", category: "material", description: "Insulation & vapor barrier", quantity: round(F * 4.5), unit: "sq ft", unitCost: t(120, 160, 220) },
    { key: "cement_drywall", category: "material", description: "Moisture-resistant drywall & cement board", quantity: board, unit: "sq ft", unitCost: t(180, 230, 300) },
    { key: "board_hang_finish", category: "labor", description: "Hang, tape & finish board", quantity: board, unit: "sq ft", unitCost: t(200, 235, 280) },
    { key: "waterproof", category: "material", description: "Shower waterproofing & pan", quantity: 1, unit: "project", unitCost: t(35000, 55000, 90000) },
    { key: "floor_tile_mat", category: "material", description: "Floor tile material", quantity: F, unit: "sq ft", unitCost: t(600, 1100, 2200) },
    { key: "wall_tile_mat", category: "material", description: "Shower/wall tile material", quantity: showerWall, unit: "sq ft", unitCost: t(700, 1300, 2600) },
    { key: "tile_setting", category: "labor", description: "Tile setting labor", quantity: tiled, unit: "sq ft", unitCost: t(900, 1100, 1500) },
    { key: "vanity_top", category: "material", description: "Vanity, top & faucet", quantity: 1, unit: "each", unitCost: t(45000, 90000, 200000) },
    { key: "toilet", category: "material", description: "Toilet", quantity: 1, unit: "each", unitCost: t(28000, 45000, 85000) },
    { key: "plumbing_trim", category: "labor", description: "Set fixtures & plumbing trim-out", quantity: 1, unit: "project", unitCost: t(85000, 100000, 130000) },
    { key: "electrical_finish", category: "labor", description: "Exhaust fan, vanity light, GFCI & switches", quantity: 1, unit: "project", unitCost: t(55000, 75000, 110000) },
    { key: "paint", category: "material", description: "Prime & paint", quantity: 1, unit: "project", unitCost: t(35000, 45000, 65000) },
    { key: "accessories", category: "material", description: "Mirror, trim, door & accessories", quantity: 1, unit: "project", unitCost: t(25000, 45000, 90000) },
    { key: "clean_haul", category: "equipment", description: "Final clean & debris haul", quantity: 1, unit: "project", unitCost: t(18000, 22000, 30000) },
  ];
}

// ------------------------------ KITCHEN ------------------------------

function kitchenSeeds(floorSqft: number): ScopeLineSeed[] {
  const F = Math.max(60, round(floorSqft));
  const board = boardArea(F);
  const linearFt = Math.max(12, round(Math.sqrt(F) * 2.6)); // rough cabinet run
  const backsplash = Math.max(24, round(linearFt * 3));
  return [
    { key: "cement_drywall", category: "material", description: "Drywall & board", quantity: board, unit: "sq ft", unitCost: t(150, 200, 270) },
    { key: "board_hang_finish", category: "labor", description: "Hang, tape & finish board", quantity: board, unit: "sq ft", unitCost: t(190, 220, 270) },
    { key: "cabinets", category: "material", description: "Cabinetry", quantity: linearFt, unit: "linear ft", unitCost: t(22000, 38000, 75000) },
    { key: "countertops", category: "material", description: "Countertops", quantity: linearFt, unit: "linear ft", unitCost: t(9000, 16000, 32000) },
    { key: "cabinet_install", category: "labor", description: "Cabinet & countertop install", quantity: linearFt, unit: "linear ft", unitCost: t(6500, 8000, 11000) },
    { key: "appliances", category: "material", description: "Appliance package allowance", quantity: 1, unit: "project", unitCost: t(350000, 650000, 1500000) },
    { key: "backsplash", category: "material", description: "Backsplash tile material", quantity: backsplash, unit: "sq ft", unitCost: t(700, 1400, 2800) },
    { key: "flooring_mat", category: "material", description: "Flooring material", quantity: F, unit: "sq ft", unitCost: t(450, 900, 1800) },
    { key: "flooring_labor", category: "labor", description: "Flooring & tile setting", quantity: F + backsplash, unit: "sq ft", unitCost: t(650, 850, 1200) },
    { key: "plumbing_trim", category: "labor", description: "Sink, faucet & disposal trim-out", quantity: 1, unit: "project", unitCost: t(90000, 115000, 160000) },
    { key: "electrical_finish", category: "labor", description: "Circuits, lighting, GFCI & switches", quantity: 1, unit: "project", unitCost: t(120000, 160000, 240000) },
    { key: "paint", category: "material", description: "Prime & paint", quantity: 1, unit: "project", unitCost: t(45000, 60000, 85000) },
    { key: "clean_haul", category: "equipment", description: "Final clean & debris haul", quantity: 1, unit: "project", unitCost: t(25000, 32000, 45000) },
  ];
}

// --------------------------- GENERIC ROOM ----------------------------

function roomSeeds(floorSqft: number): ScopeLineSeed[] {
  const F = Math.max(40, round(floorSqft));
  const board = boardArea(F);
  return [
    { key: "insulation", category: "material", description: "Insulation", quantity: round(F * 4), unit: "sq ft", unitCost: t(90, 130, 190) },
    { key: "cement_drywall", category: "material", description: "Drywall & board", quantity: board, unit: "sq ft", unitCost: t(140, 185, 250) },
    { key: "board_hang_finish", category: "labor", description: "Hang, tape & finish board", quantity: board, unit: "sq ft", unitCost: t(185, 215, 260) },
    { key: "flooring_mat", category: "material", description: "Flooring material", quantity: F, unit: "sq ft", unitCost: t(400, 850, 1700) },
    { key: "flooring_labor", category: "labor", description: "Flooring install", quantity: F, unit: "sq ft", unitCost: t(350, 500, 750) },
    { key: "trim_doors", category: "material", description: "Baseboard, casing & doors", quantity: 1, unit: "project", unitCost: t(45000, 75000, 140000) },
    { key: "electrical_finish", category: "labor", description: "Outlets, switches & lighting", quantity: 1, unit: "project", unitCost: t(45000, 65000, 95000) },
    { key: "paint", category: "material", description: "Prime & paint", quantity: 1, unit: "project", unitCost: t(40000, 55000, 80000) },
    { key: "clean_haul", category: "equipment", description: "Final clean & debris haul", quantity: 1, unit: "project", unitCost: t(15000, 20000, 28000) },
  ];
}

// Items already complete once the space is "drywalled" (board + insulation done).
const BOARD_KEYS = new Set(["insulation", "cement_drywall", "board_hang_finish", "waterproof"]);
// Items kept for a purely cosmetic refresh.
const COSMETIC_KEYS = new Set([
  "paint",
  "accessories",
  "trim_doors",
  "flooring_mat",
  "flooring_labor",
  "vanity_top",
  "toilet",
  "electrical_finish",
  "clean_haul",
  "backsplash",
]);

function applyState(seeds: ScopeLineSeed[], state: CurrentState): ScopeLineSeed[] {
  if (state === "cosmetic") return seeds.filter((s) => COSMETIC_KEYS.has(s.key));
  if (state === "drywalled") return seeds.filter((s) => !BOARD_KEYS.has(s.key));
  // framed / rough_in / gutted → the full finish scope
  return seeds;
}

function seedsFor(roomType: RoomType, floorSqft: number): ScopeLineSeed[] {
  if (roomType === "bathroom") return bathroomSeeds(floorSqft);
  if (roomType === "kitchen") return kitchenSeeds(floorSqft);
  return roomSeeds(floorSqft);
}

const STATE_SUMMARY: Record<CurrentState, string> = {
  framed: "Framed — studs exposed, no drywall, rough-ins in place.",
  rough_in: "Rough-in stage — framing and mechanical rough-ins done, ready to close walls.",
  drywalled: "Drywalled — walls boarded and ready for finishes.",
  gutted: "Gutted to the studs — full finish scope ahead.",
  cosmetic: "Functional but dated — a cosmetic refresh.",
};

/**
 * Deterministic template scope — the zero-key path and the AI's grounding
 * reference. Realistic, editable, honest about being a default.
 */
export function templateScope(
  roomType: RoomType,
  currentState: CurrentState,
  floorSqft: number,
): ScopeResult {
  const items = applyState(seedsFor(roomType, floorSqft), currentState);
  const confidence = 0.55; // a sound default, not a measurement
  return {
    vertical: "remodel",
    roomType,
    currentState,
    floorSqft: Math.max(20, round(floorSqft)),
    currentStateSummary: STATE_SUMMARY[currentState],
    remainingSummary: `Finish a ${roomType} of about ${Math.max(20, round(floorSqft))} sq ft to a complete, move-in-ready standard.`,
    items,
    assumptions: [
      "Standard finishes and layout; no structural, window, or footprint changes.",
      "Mechanical rough-ins (plumbing/electrical) are in the correct locations.",
      "Pricing is a grounded default — confirm every line against your own rate card.",
    ],
    confidence,
    confidenceBand: confidenceBand(confidence),
    source: "template",
  };
}
