import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { badRequest, readJson, unauthorized } from "@/lib/http";
import { sanitizeRateConfig } from "@/lib/verticals/rate-overrides";

export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const body = await readJson<{ regionalFactor?: unknown; rates?: Record<string, Record<string, unknown>> }>(req);
  if (!body) return badRequest();

  // Key-allow-listed, shape-checked, clamped, tier-sorted; roofing overrides rejected.
  const config = sanitizeRateConfig(body);
  try {
    const store = await getStore();
    const updated = await store.updateContractorRateConfig(contractorId, config);
    if (!updated) return badRequest("not_found");
    return NextResponse.json({ ok: true, rateConfig: config });
  } catch {
    // Never leak raw store/Postgres errors to the client.
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
