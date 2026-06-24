import Anthropic from "@anthropic-ai/sdk";
import { env, hasKey } from "@/config/env";
import { templateScope } from "@/lib/scope/catalog";
import { confidenceBand, isCurrentState, isRoomType } from "@/lib/scope/types";
import type { CurrentState, RoomType, ScopeLineSeed, ScopeResult } from "@/lib/scope/types";
import { clampCents } from "@/lib/verticals/rate-overrides";
import type { ItemCategory } from "@/lib/takeoff/types";

export interface ScopePhoto {
  data: string; // base64 (no data: prefix)
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

export interface ScopeContext {
  roomType?: RoomType;
  currentState?: CurrentState;
  floorSqft?: number;
  notes?: string;
}

const CATEGORIES: ItemCategory[] = ["material", "labor", "equipment", "fee"];

const SYSTEM_PROMPT = `You are a remodeling estimator's field assistant. You receive one or more ground-level photos of an interior room that is mid-construction (for example: framed with no drywall, drywalled but unfinished, or gutted to the studs).

Your job is to read the photos and report (a) what kind of room it is, (b) its CURRENT state of completion, and (c) the WORK REMAINING to finish it to a normal, move-in-ready standard, as discrete construction line items.

Rules:
- Identify the room type and how finished it already is. Only list work that is NOT yet done — never re-quote drywall on a room that is already drywalled.
- Each line item has a category (material, labor, equipment, or fee), a short description, a quantity, and a unit (e.g. "sq ft", "each", "project", "linear ft").
- You may PROPOSE a unit cost in cents as a starting point, but you are NOT the source of truth on price — the contractor confirms every line. Quantities and scope are where you add value; be realistic, not aggressive.
- Use the floor area provided. Do NOT invent room dimensions you cannot see; if area is missing, estimate conservatively and say so in assumptions.
- Be explicit and honest about what the photos cannot show (behind walls, subfloor condition, code issues). List these as assumptions. A modest, honest scope beats a confident wrong one — lower your confidence for blur, partial views, or ambiguity.
- Always answer via the report_scope tool.`;

const REPORT_SCOPE_TOOL: Anthropic.Tool = {
  name: "report_scope",
  description: "Report the room, its current state, and the remaining work to finish it as line items.",
  input_schema: {
    type: "object",
    properties: {
      room_type: { type: "string", enum: ["bathroom", "kitchen", "bedroom", "living", "laundry", "basement", "room"] },
      current_state: { type: "string", enum: ["framed", "rough_in", "drywalled", "gutted", "cosmetic"] },
      floor_sqft_estimate: { type: ["number", "null"], description: "Best estimate of floor area in sq ft, or null if unknowable." },
      current_state_summary: { type: "string", description: "1-2 sentences: what is already done." },
      remaining_summary: { type: "string", description: "1-2 sentences: what is left to finish." },
      items: {
        type: "array",
        description: "Remaining work as line items.",
        items: {
          type: "object",
          properties: {
            key: { type: "string", description: "short snake_case id, e.g. floor_tile_mat" },
            category: { type: "string", enum: ["material", "labor", "equipment", "fee"] },
            description: { type: "string" },
            quantity: { type: "number" },
            unit: { type: "string" },
            unit_cost_cents: { type: ["integer", "null"], description: "Optional starting unit cost in cents." },
          },
          required: ["category", "description", "quantity", "unit"],
        },
      },
      assumptions: { type: "array", items: { type: "string" } },
      confidence: { type: "number", description: "0..1" },
    },
    required: ["room_type", "current_state", "current_state_summary", "remaining_summary", "items", "assumptions", "confidence"],
  },
};

interface ReportScope {
  room_type: RoomType;
  current_state: CurrentState;
  floor_sqft_estimate: number | null;
  current_state_summary: string;
  remaining_summary: string;
  items: {
    key?: string;
    category: ItemCategory;
    description: string;
    quantity: number;
    unit: string;
    unit_cost_cents?: number | null;
  }[];
  assumptions: string[];
  confidence: number;
}

/** Pull tiered fallback unit costs from the matching grounded template line, by key. */
function templateCostByKey(roomType: RoomType, currentState: CurrentState, floorSqft: number) {
  const map = new Map<string, ScopeLineSeed["unitCost"]>();
  for (const s of templateScope(roomType, currentState, floorSqft).items) map.set(s.key, s.unitCost);
  return map;
}

function normalizeReport(report: ReportScope, ctx: ScopeContext): ScopeResult {
  const floorSqft = Math.max(20, Math.round(report.floor_sqft_estimate ?? ctx.floorSqft ?? 48));
  const costMap = templateCostByKey(report.room_type, report.current_state, floorSqft);

  const items: ScopeLineSeed[] = report.items
    .filter((it) => it && Number(it.quantity) > 0 && it.description)
    .map((it, idx) => {
      const key = (it.key || `ai_${idx + 1}`).replace(/\s+/g, "_").slice(0, 64);
      // Prefer a grounded template cost for a known key; else use the model's
      // suggestion (clamped); else a conservative flat default.
      const grounded = costMap.get(key);
      const suggested = it.unit_cost_cents != null ? clampCents(Number(it.unit_cost_cents)) : null;
      const unitCost = grounded ?? (suggested != null && suggested > 0 ? suggested : 5000);
      return {
        key,
        category: CATEGORIES.includes(it.category) ? it.category : "material",
        description: String(it.description).slice(0, 200),
        quantity: Math.max(0, Math.round(Number(it.quantity) * 100) / 100),
        unit: String(it.unit || "ea").slice(0, 24),
        unitCost,
      };
    });

  // If the model returned nothing usable, fall back to the grounded template.
  if (items.length === 0) {
    return { ...templateScope(report.room_type, report.current_state, floorSqft), source: "ai" };
  }

  const confidence = Math.min(1, Math.max(0, Number(report.confidence) || 0.5));
  return {
    vertical: "remodel",
    roomType: report.room_type,
    currentState: report.current_state,
    floorSqft,
    currentStateSummary: report.current_state_summary?.slice(0, 400) || "",
    remainingSummary: report.remaining_summary?.slice(0, 400) || "",
    items,
    assumptions: (report.assumptions ?? []).slice(0, 8).map((a) => String(a).slice(0, 240)),
    confidence,
    confidenceBand: confidenceBand(confidence),
    source: "ai",
  };
}

/**
 * Read ground-level photos and infer the remaining scope. Falls back to a grounded
 * deterministic template whenever the Anthropic key is absent or the call fails — so
 * this feature always produces a usable, editable quote.
 */
export async function analyzeScopePhotos(photos: ScopePhoto[], ctx: ScopeContext = {}): Promise<ScopeResult> {
  const roomType: RoomType = isRoomType(ctx.roomType) ? ctx.roomType : "bathroom";
  const currentState: CurrentState = isCurrentState(ctx.currentState) ? ctx.currentState : "framed";
  const floorSqft = Math.max(20, Math.round(ctx.floorSqft ?? 48));

  if (!hasKey("anthropic") || photos.length === 0) {
    return templateScope(roomType, currentState, floorSqft);
  }

  const client = new Anthropic({ apiKey: env.anthropicKey });
  try {
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools: [REPORT_SCOPE_TOOL],
      tool_choice: { type: "tool", name: "report_scope" },
      messages: [
        {
          role: "user",
          content: [
            ...photos.slice(0, 6).map((p) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: p.mediaType, data: p.data },
            })),
            {
              type: "text" as const,
              text:
                `Room type hint: ${roomType}. Current-state hint: ${currentState}. Floor area: ~${floorSqft} sq ft.` +
                (ctx.notes ? ` Contractor notes: ${ctx.notes}.` : "") +
                ` List only the work remaining to finish this space, via report_scope.`,
            },
          ],
        },
      ],
    });
    const toolUse = res.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUse) return templateScope(roomType, currentState, floorSqft);
    return normalizeReport(toolUse.input as unknown as ReportScope, { roomType, currentState, floorSqft });
  } catch (err) {
    console.error("analyzeScopePhotos failed:", err);
    return templateScope(roomType, currentState, floorSqft);
  }
}
