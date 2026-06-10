import { NextResponse, after } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { generateScopeCopy, genericScopeCopy } from "@/lib/ai/scope";
import { generateRenderForJob } from "@/lib/render/generate";
import { badRequest, readJson, unauthorized } from "@/lib/http";
import type { ScopeCopy } from "@/lib/db/types";
import type { Tier } from "@/lib/takeoff/types";

export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const body = await readJson<{ jobId: string; estimateId: string; selectedTier: Tier }>(req);
  if (!body?.jobId || !body?.estimateId) return badRequest("missing_fields");

  const store = await getStore();
  const job = await store.getJob(body.jobId);
  const estimate = await store.getEstimate(body.estimateId);
  const contractor = await store.getContractor(contractorId);
  // The estimate must belong to this tenant AND this job (prevents cross-tenant IDOR).
  if (
    !job ||
    job.contractorId !== contractorId ||
    !estimate ||
    estimate.contractorId !== contractorId ||
    estimate.jobId !== job.id ||
    !contractor
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await store.setSelectedTier(estimate.id, body.selectedTier);
  const tier = estimate.tiers.find((t) => t.tier === body.selectedTier) ?? estimate.tiers[1];

  let scopeCopy: ScopeCopy;
  if (job.vertical === "roofing") {
    const takeoff = await store.getLatestTakeoff(job.id);
    scopeCopy = await generateScopeCopy({
      contractorName: contractor.name,
      homeownerName: job.homeownerName,
      address: job.address,
      detail: takeoff?.measurement.detail ?? {
        footprintSqft: 0,
        perimeterLf: 0,
        pitchX12: 6,
        pitchSource: "complexity_default",
        complexity: "moderate",
        facetCount: 4,
        stories: 1,
        existingLayers: 1,
        obstructions: [],
      },
      tier,
    });
  } else {
    scopeCopy = genericScopeCopy({
      contractorName: contractor.name,
      homeownerName: job.homeownerName,
      address: job.address,
      vertical: job.vertical,
      tier,
      inputs: estimate.inputs ?? {},
    });
  }

  const proposal = await store.createProposal({
    jobId: job.id,
    contractorId,
    estimateId: estimate.id,
    scopeCopy,
  });
  await store.updateJobStatus(job.id, "proposed");

  // Fire the AI "after" render AFTER the response (never in the quoting loop).
  // No-op in demo/keyless mode; the swatch board is the always-on fallback.
  const renderTier = tier.tier;
  after(async () => {
    try {
      await generateRenderForJob(store, { jobId: job.id, vertical: job.vertical, tier: renderTier });
    } catch {
      /* best-effort */
    }
  });

  return NextResponse.json({ token: proposal.publicToken });
}
