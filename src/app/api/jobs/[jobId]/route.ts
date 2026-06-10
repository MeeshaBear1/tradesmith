import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore, type Store } from "@/lib/db/store";
import type { JobUpdate } from "@/lib/db/store";
import { badRequest, readJson, unauthorized } from "@/lib/http";

async function ownedJob(store: Store, contractorId: string, jobId: string) {
  const job = await store.getJob(jobId);
  return job && job.contractorId === contractorId ? job : null;
}

/** Edit a job's homeowner/address. Tenant-scoped. */
export async function PATCH(req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();
  const { jobId } = await ctx.params;
  const store = await getStore();
  if (!(await ownedJob(store, contractorId, jobId))) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await readJson<Record<string, unknown>>(req);
  const fields: JobUpdate = {};
  if (typeof body?.homeownerName === "string" && body.homeownerName.trim()) fields.homeownerName = body.homeownerName.trim();
  if (typeof body?.homeownerEmail === "string") fields.homeownerEmail = body.homeownerEmail.trim() || null;
  if (typeof body?.address === "string" && body.address.trim()) fields.address = body.address.trim();
  if (Object.keys(fields).length === 0) return badRequest("no_fields");

  const job = await store.updateJob(jobId, fields);
  return NextResponse.json({ ok: true, job });
}

/** Delete a job and everything hanging off it. Tenant-scoped. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();
  const { jobId } = await ctx.params;
  const store = await getStore();
  if (!(await ownedJob(store, contractorId, jobId))) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await store.deleteJob(jobId);
  return NextResponse.json({ ok: true });
}
