import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { badRequest, readJson, unauthorized } from "@/lib/http";
import { getVertical, isVertical } from "@/lib/verticals/registry";
import type { RateConfig, RateTable, RateValue } from "@/lib/verticals/types";

const RATE_CEILING_CENTS = 5_000_000; // $50,000 per unit — well above any real rate

const clampCents = (v: number) => Math.min(RATE_CEILING_CENTS, Math.max(0, Math.round(v)));

/**
 * Validate one override value AGAINST ITS SEED so it can't change the pricing
 * semantics: the override must match the seed's flat/tiered shape, is clamped to a
 * sane ceiling (prevents int overflow on the charge path), and tiered values are
 * sorted ascending so Good <= Better <= Best can never invert.
 */
function cleanAgainstSeed(seed: RateValue | undefined, v: unknown): RateValue | null {
  if (seed == null) return null; // unknown rateKey — drop (key allow-list)
  const seedTiered = typeof seed === "object";

  if (!seedTiered) {
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    return clampCents(v);
  }

  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ok = (["good", "better", "best"] as const).every(
    (k) => typeof o[k] === "number" && Number.isFinite(o[k] as number),
  );
  if (!ok) return null;
  const sorted = [o.good as number, o.better as number, o.best as number].map(clampCents).sort((a, b) => a - b);
  return { good: sorted[0], better: sorted[1], best: sorted[2] };
}

export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const body = await readJson<{ regionalFactor?: unknown; rates?: Record<string, Record<string, unknown>> }>(req);
  if (!body) return badRequest();

  const rf = Number(body.regionalFactor);
  const regionalFactor = Number.isFinite(rf) ? Math.min(2.5, Math.max(0.5, rf)) : 1;

  const rates: Record<string, RateTable> = {};
  for (const [vertical, table] of Object.entries(body.rates ?? {})) {
    // Only known, form-priced trades. Roofing is geometry-priced; its overrides are ignored, so reject them.
    if (!isVertical(vertical) || vertical === "roofing" || !table || typeof table !== "object") continue;
    const seedRates = getVertical(vertical).rates;
    const clean: RateTable = {};
    for (const [k, v] of Object.entries(table)) {
      const cv = cleanAgainstSeed(seedRates[k], v); // seedRates[k] === undefined → dropped
      if (cv != null) clean[k] = cv;
    }
    if (Object.keys(clean).length) rates[vertical] = clean;
  }

  const config: RateConfig = { regionalFactor, rates };
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
