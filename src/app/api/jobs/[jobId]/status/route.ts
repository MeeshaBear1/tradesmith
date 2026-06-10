import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import type { JobStatus } from "@/lib/db/types";
import { badRequest, readJson, unauthorized, notFoundJson } from "@/lib/http";

const STATUSES: JobStatus[] = ["new", "measured", "estimated", "proposed", "accepted", "invoiced", "paid"];

/** Advance/retreat a job's pipeline stage. Tenant-scoped. */
export async function PATCH(req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();
  const { jobId } = await ctx.params;
  const store = await getStore();
  const job = await store.getJob(jobId);
  if (!job || job.contractorId !== contractorId) return notFoundJson();

  const body = await readJson<{ status?: string }>(req);
  const status = body?.status as JobStatus | undefined;
  if (!status || !STATUSES.includes(status)) return badRequest("invalid_status");

  await store.updateJobStatus(jobId, status);
  return NextResponse.json({ ok: true });
}
