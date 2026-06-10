import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { badRequest, readJson, unauthorized } from "@/lib/http";
import { generateRenderForJob } from "@/lib/render/generate";
import type { Tier } from "@/lib/takeoff/types";

const TIERS: Tier[] = ["good", "better", "best"];

/**
 * Contractor-authed manual (re)generate of a job's AI render. Awaited here (manual
 * trigger), unlike the fire-and-forget path on proposal-create. Returns the render
 * outcome; in demo/keyless mode this is `{ status: "none", reason: "render_disabled" }`.
 */
export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const body = await readJson<{ jobId: string; tier?: string; colorName?: string }>(req);
  if (!body?.jobId) return badRequest("missing_jobId");

  const store = await getStore();
  const job = await store.getJob(body.jobId);
  if (!job || job.contractorId !== contractorId) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  const tier: Tier = TIERS.includes(body.tier as Tier) ? (body.tier as Tier) : "better";
  const outcome = await generateRenderForJob(store, {
    jobId: job.id,
    vertical: job.vertical,
    tier,
    colorName: body.colorName,
  });
  return NextResponse.json(outcome);
}
