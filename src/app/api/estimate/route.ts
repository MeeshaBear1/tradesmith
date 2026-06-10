import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { getEngine } from "@/lib/takeoff/registry";
import { sanitizeDetailOverride } from "@/lib/roofing/sanitize";
import { getVertical } from "@/lib/verticals/registry";
import { estimateVertical, sanitizeInputs } from "@/lib/verticals/engine";
import { badRequest, readJson, unauthorized } from "@/lib/http";
import type { EstimateTier, Inputs, RoofingDetail, Tier } from "@/lib/takeoff/types";

export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const body = await readJson<{
    jobId: string;
    detail?: Partial<RoofingDetail>; // roofing
    inputs?: Inputs; // form verticals
    selectedTier?: Tier;
  }>(req);
  if (!body?.jobId) return badRequest("missing_jobId");

  const store = await getStore();
  const job = await store.getJob(body.jobId);
  if (!job || job.contractorId !== contractorId) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }
  const contractor = await store.getContractor(contractorId);
  const rateConfig = contractor?.rateConfig ?? null;
  const regionalFactor = rateConfig?.regionalFactor ?? 1;

  let tiers: EstimateTier[];
  let takeoffId: string | null = null;
  let inputs: Inputs | null = null;

  if (job.vertical === "roofing") {
    // AI-measured path: price from the takeoff (+ sanitized editor overrides).
    const takeoff = await store.getLatestTakeoff(job.id);
    if (!takeoff) return badRequest("no_takeoff");
    takeoffId = takeoff.id;
    const engine = getEngine("roofing");
    const measurement = { ...takeoff.measurement };
    const override = sanitizeDetailOverride(body.detail);
    if (Object.keys(override).length > 0) {
      measurement.detail = { ...measurement.detail, ...override };
      measurement.primaryQuantity = measurement.detail.footprintSqft;
      if (measurement.source === "ai") measurement.source = "ai_overridden";
    }
    // Apply the contractor's regional factor to roofing's rate card.
    const rateCard = { ...engine.defaultRateCard(), regionalFactor };
    tiers = engine.estimate(measurement, rateCard);
  } else {
    // Form-based path: price from sanitized inputs via the generic estimator,
    // with the contractor's per-trade rate overrides + regional factor.
    const config = getVertical(job.vertical);
    inputs = sanitizeInputs(config, body.inputs ?? {});
    tiers = estimateVertical(config, inputs, {
      regionalFactor,
      rates: rateConfig?.rates?.[job.vertical],
    });
  }

  const TIER_KEYS: Tier[] = ["good", "better", "best"];
  const selectedTier: Tier = TIER_KEYS.includes(body.selectedTier as Tier)
    ? (body.selectedTier as Tier)
    : "better";
  const totalCents =
    tiers.find((t) => t.tier === selectedTier)?.totalCents ?? tiers[1]?.totalCents ?? tiers[0].totalCents;

  const estimate = await store.createEstimate({
    jobId: job.id,
    contractorId,
    vertical: job.vertical,
    takeoffId,
    inputs,
    tiers,
    selectedTier,
    totalCents,
  });
  await store.updateJobStatus(job.id, "estimated");

  return NextResponse.json({ estimateId: estimate.id, tiers, selectedTier });
}
