import Anthropic from "@anthropic-ai/sdk";
import { env, hasKey } from "@/config/env";

export const TILE_ZOOM = 20;
export const TILE_ZOOM_FALLBACK = 19;
export const TILE_LOGICAL_SIZE = 600;

export interface GeocodeResult {
  lat: number;
  lng: number;
  relevance: number;
}

export interface ReportRoof {
  building_identified: boolean;
  roof_polygon_norm: [number, number][];
  roof_touches_edge: boolean;
  facet_count: number;
  complexity: "simple" | "moderate" | "complex";
  predominant_pitch: "flat" | "low" | "medium" | "steep" | "unknown";
  predominant_pitch_guess_x12: number | null;
  stories_guess: number | null;
  obstructions: { type: string; count: number }[];
  self_estimated_footprint_sqft: number | null;
  confidence: number;
  reasoning: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!hasKey("mapbox") || !address.trim()) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
    `?access_token=${env.mapboxToken}&limit=1&types=address`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { center: [number, number]; relevance: number }[] };
    const f = data.features?.[0];
    if (!f) return null;
    return { lng: f.center[0], lat: f.center[1], relevance: f.relevance ?? 1 };
  } catch {
    return null;
  }
}

export function staticImageUrl(lng: number, lat: number, zoom = TILE_ZOOM): string {
  return (
    `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/` +
    `${lng},${lat},${zoom},0,0/${TILE_LOGICAL_SIZE}x${TILE_LOGICAL_SIZE}@2x` +
    `?access_token=${env.mapboxToken}&attribution=false&logo=false`
  );
}

async function fetchImageBase64(url: string): Promise<{ data: string; mediaType: "image/png" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { data: buf.toString("base64"), mediaType: "image/png" };
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are a roofing estimator's aerial-imagery analyst. You receive ONE top-down (nadir) satellite image of a residential property. Identify the single primary building nearest the image center and trace the outline of its roof as seen from above (the footprint at the eaves / drip edge), then characterize the roof.

Rules:
- Trace ONLY the main building. Exclude driveways, pools, sheds, detached garages (unless physically attached), lawn, and shadows.
- Output polygon vertices as fractions of image dimensions (0 = left/top, 1 = right/bottom), in order around the outline. Approximate curves with straight segments. Capture L / T / wing shapes.
- The image is exactly top-down; you CANNOT see vertical rise directly. Estimate pitch only from shadow length and plane foreshortening, and say "unknown" when unsure. Never invent a precise pitch.
- Count facets (distinct sloped planes) and note valleys / dormers / penetrations — these drive material waste.
- Do NOT compute square footage from pixels; the calling system has the exact scale and computes area from your polygon. The footprint field is only a sanity-check guess.
- Lower your confidence honestly for tree cover, deep shadow, blur, or ambiguity about which building is the subject. A low-confidence honest answer beats a confident wrong one.
- Always return via the report_roof tool.`;

const REPORT_ROOF_TOOL: Anthropic.Tool = {
  name: "report_roof",
  description: "Report the roof measurement extracted from a top-down satellite image of a single building.",
  input_schema: {
    type: "object",
    properties: {
      building_identified: { type: "boolean", description: "True if a clear primary building roof is visible near the image center." },
      roof_polygon_norm: {
        type: "array",
        description: "Ordered outer-outline vertices, each [x,y] as a fraction 0..1 of image width/height. 4-12 points.",
        items: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
        minItems: 3,
      },
      roof_touches_edge: { type: "boolean", description: "True if the roof is cut off by any image edge (zoom too high)." },
      facet_count: { type: "integer", description: "Number of distinct roof planes (gable=2, hip=4, complex=8+)." },
      complexity: { type: "string", enum: ["simple", "moderate", "complex"] },
      predominant_pitch: { type: "string", enum: ["flat", "low", "medium", "steep", "unknown"] },
      predominant_pitch_guess_x12: { type: ["integer", "null"], description: "Best guess in x/12, or null." },
      stories_guess: { type: ["integer", "null"] },
      obstructions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["chimney", "skylight", "vent", "hvac_unit", "solar_panel", "tree_overhang", "dormer", "valley", "other"] },
            count: { type: "integer" },
          },
          required: ["type", "count"],
        },
      },
      self_estimated_footprint_sqft: { type: ["number", "null"] },
      confidence: { type: "number", description: "0..1" },
      reasoning: { type: "string", description: "2-4 sentences on what you saw and why this confidence." },
    },
    required: [
      "building_identified",
      "roof_polygon_norm",
      "roof_touches_edge",
      "facet_count",
      "complexity",
      "predominant_pitch",
      "obstructions",
      "confidence",
      "reasoning",
    ],
  },
};

export async function analyzeRoofImage(
  imageBase64: string,
  mediaType: "image/png",
  address: string,
  metersPerPixel: number,
): Promise<ReportRoof | null> {
  if (!hasKey("anthropic")) return null;
  const client = new Anthropic({ apiKey: env.anthropicKey });
  try {
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools: [REPORT_ROOF_TOOL],
      tool_choice: { type: "tool", name: "report_roof" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            {
              type: "text",
              text: `Property address: ${address}. Approx ground scale: 1 image-pixel ≈ ${metersPerPixel.toFixed(3)} m. The primary residence should be near the center. Trace its roof and report via report_roof.`,
            },
          ],
        },
      ],
    });
    const toolUse = res.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUse) return null;
    return toolUse.input as unknown as ReportRoof;
  } catch (err) {
    console.error("analyzeRoofImage failed:", err);
    return null;
  }
}

export { fetchImageBase64 };
