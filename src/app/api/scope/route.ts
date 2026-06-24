import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { analyzeScopePhotos, type ScopePhoto } from "@/lib/scope/vision";
import { estimateFromScope } from "@/lib/scope/estimate";
import { checkCostLimit } from "@/lib/ratelimit";
import { badRequest, readJson, tooManyRequests, unauthorized } from "@/lib/http";
import type { CurrentState, RoomType } from "@/lib/scope/types";
import type { Tier } from "@/lib/takeoff/types";

export const runtime = "nodejs";

const MEDIA = new Set(["image/jpeg", "image/png", "image/webp"]);
const TIER_KEYS: Tier[] = ["good", "better", "best"];

/** Accept either a data: URL string or a { data, mediaType } object. */
function parsePhoto(raw: unknown): ScopePhoto | null {
  if (typeof raw === "string") {
    const m = raw.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    return m ? { mediaType: m[1] as ScopePhoto["mediaType"], data: m[2] } : null;
  }
  if (raw && typeof raw === "object") {
    const o = raw as { data?: unknown; mediaType?: unknown };
    if (typeof o.data === "string" && typeof o.mediaType === "string" && MEDIA.has(o.mediaType)) {
      const data = o.data.includes(",") ? o.data.split(",").pop()! : o.data;
      return { mediaType: o.mediaType as ScopePhoto["mediaType"], data };
    }
  }
  return null;
}

/**
 * Photo → scope → quote. Reads ground-level photos of a mid-construction room and
 * returns a Good/Better/Best, line-item estimate of the work remaining, priced with
 * the contractor's regional factor and rate card. Always usable: with no Anthropic
 * key it falls back to a grounded template scope. The estimate opens in review mode
 * (the contractor confirms every line via PATCH /api/estimate/[id]).
 */
export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const limit = checkCostLimit("scope", contractorId);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSec);

  const body = await readJson<{
    jobId: string;
    photos?: unknown[];
    roomType?: RoomType;
    currentState?: CurrentState;
    floorSqft?: number;
    notes?: string;
    selectedTier?: Tier;
  }>(req);
  if (!body?.jobId) return badRequest("missing_jobId");

  const store = await getStore();
  const job = await store.getJob(body.jobId);
  if (!job || job.contractorId !== contractorId) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  const photos = Array.isArray(body.photos)
    ? body.photos.map(parsePhoto).filter((p): p is ScopePhoto => p !== null).slice(0, 6)
    : [];
  const floorSqft = Math.min(5000, Math.max(20, Math.round(Number(body.floorSqft) || 48)));

  const scope = await analyzeScopePhotos(photos, {
    roomType: body.roomType,
    currentState: body.currentState,
    floorSqft,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : undefined,
  });

  const contractor = await store.getContractor(contractorId);
  const regionalFactor = contractor?.rateConfig?.regionalFactor ?? 1;

  const tiers = estimateFromScope(scope.items, {
    regionalFactor,
    displayQty: scope.floorSqft,
    displayUnit: "sq ft",
  });

  const selectedTier: Tier = TIER_KEYS.includes(body.selectedTier as Tier)
    ? (body.selectedTier as Tier)
    : "better";
  const totalCents = tiers.find((t) => t.tier === selectedTier)?.totalCents ?? tiers[1].totalCents;

  const scopeMeta = {
    roomType: scope.roomType,
    currentState: scope.currentState,
    floorSqft: scope.floorSqft,
    currentStateSummary: scope.currentStateSummary,
    remainingSummary: scope.remainingSummary,
    assumptions: scope.assumptions,
    confidence: scope.confidence,
    confidenceBand: scope.confidenceBand,
    source: scope.source,
  };

  const estimate = await store.createEstimate({
    jobId: job.id,
    contractorId,
    vertical: job.vertical,
    takeoffId: null,
    inputs: { roomType: scope.roomType, currentState: scope.currentState, floorSqft: scope.floorSqft },
    tiers,
    selectedTier,
    totalCents,
    regionalFactor,
    scopeMeta,
  });
  await store.updateJobStatus(job.id, "estimated");

  return NextResponse.json({
    estimateId: estimate.id,
    tiers,
    selectedTier,
    scope: { ...scopeMeta, itemCount: scope.items.length },
  });
}
