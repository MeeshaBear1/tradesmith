import type { ConfidenceBand, ItemCategory, Vertical } from "@/lib/takeoff/types";
import type { RateValue } from "@/lib/verticals/types";

/**
 * Photo-driven interior scope (the "snap a photo of a framed room → quote the
 * finished job" feature). The AI reads ground-level photos to infer the room and
 * its CURRENT state, then enumerates the WORK REMAINING as discrete line items.
 *
 * Honesty principle (mirrors roofing): the model proposes the *scope* — what work
 * is left and how much of it — but pricing comes from grounded unit costs the
 * contractor can edit. A photo-scoped estimate always opens in "review every line"
 * mode; nothing is sent to a homeowner unconfirmed.
 */

export type RoomType =
  | "bathroom"
  | "kitchen"
  | "bedroom"
  | "living"
  | "laundry"
  | "basement"
  | "room";

/** How finished the space already is — drives which line items remain. */
export type CurrentState = "framed" | "rough_in" | "drywalled" | "gutted" | "cosmetic";

export interface ScopeLineSeed {
  key: string;
  category: ItemCategory;
  description: string;
  quantity: number;
  unit: string;
  /** Tiered (good/better/best) or flat unit cost in cents. Editable downstream. */
  unitCost: RateValue;
}

export interface ScopeResult {
  vertical: Vertical; // typically "remodel"
  roomType: RoomType;
  currentState: CurrentState;
  floorSqft: number;
  /** Plain-language read of what is already done. */
  currentStateSummary: string;
  /** What is left to finish the space to a normal standard. */
  remainingSummary: string;
  items: ScopeLineSeed[];
  /** Honest caveats about what the photos could not show. */
  assumptions: string[];
  confidence: number; // 0..1
  confidenceBand: ConfidenceBand;
  source: "ai" | "template";
}

export const ROOM_TYPES: RoomType[] = [
  "bathroom",
  "kitchen",
  "bedroom",
  "living",
  "laundry",
  "basement",
  "room",
];

export const CURRENT_STATES: CurrentState[] = [
  "framed",
  "rough_in",
  "drywalled",
  "gutted",
  "cosmetic",
];

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
}

export function isRoomType(v: unknown): v is RoomType {
  return typeof v === "string" && (ROOM_TYPES as string[]).includes(v);
}

export function isCurrentState(v: unknown): v is CurrentState {
  return typeof v === "string" && (CURRENT_STATES as string[]).includes(v);
}
