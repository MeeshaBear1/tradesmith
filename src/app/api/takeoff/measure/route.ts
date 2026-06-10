import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { getEngine } from "@/lib/takeoff/registry";
import { sanitizeDetailOverride } from "@/lib/roofing/sanitize";
import { badRequest, readJson, unauthorized } from "@/lib/http";
import type { RoofingDetail } from "@/lib/takeoff/types";

export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const body = await readJson<{ jobId: string; manual?: Partial<RoofingDetail> }>(req);
  if (!body?.jobId) return badRequest("missing_jobId");

  const store = await getStore();
  const job = await store.getJob(body.jobId);
  if (!job || job.contractorId !== contractorId) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  const engine = getEngine("roofing");
  const manual = body.manual ? sanitizeDetailOverride(body.manual) : undefined;
  const measurement = await engine.measure(
    { id: job.id, address: job.address, lat: job.lat, lng: job.lng },
    manual && Object.keys(manual).length > 0 ? { manual } : undefined,
  );

  const takeoff = await store.createTakeoff({
    jobId: job.id,
    contractorId,
    vertical: job.vertical,
    source: measurement.source,
    satelliteImageUrl: measurement.satelliteImageUrl ?? null,
    measurement,
    confidence: measurement.confidence,
  });
  await store.updateJobStatus(job.id, "measured");

  return NextResponse.json({ takeoffId: takeoff.id, measurement });
}
