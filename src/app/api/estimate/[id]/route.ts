import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { recomputeTier, sanitizeLineItems } from "@/lib/estimate/edit";
import { badRequest, conflict, notFoundJson, readJson, unauthorized } from "@/lib/http";
import type { EstimateTier, Tier } from "@/lib/takeoff/types";

export const runtime = "nodejs";

const TIER_KEYS: Tier[] = ["good", "better", "best"];

/**
 * Edit an estimate's line items. The contractor can add, remove, retitle, re-quantity
 * or re-price any line on any tier; the category buckets, base, compounding markup
 * and total are all re-derived server-side — a client total is never trusted. Blocked
 * once the homeowner has signed (the price is locked).
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();
  const { id } = await ctx.params;

  const body = await readJson<{
    tier?: Tier;
    lineItems?: unknown;
    tiers?: { tier: Tier; lineItems: unknown }[];
    selectedTier?: Tier;
  }>(req);
  if (!body) return badRequest("bad_body");

  const store = await getStore();
  const estimate = await store.getEstimate(id);
  if (!estimate || estimate.contractorId !== contractorId) return notFoundJson("estimate_not_found");

  // Never change a price the homeowner has already signed.
  const proposal = await store.getProposalForJob(estimate.jobId);
  if (proposal?.status === "accepted") return conflict("estimate_locked");

  // Normalize to a list of { tier, lineItems } edits.
  const edits = Array.isArray(body.tiers)
    ? body.tiers
    : body.tier
      ? [{ tier: body.tier, lineItems: body.lineItems }]
      : [];
  const valid = edits.filter((e) => e && TIER_KEYS.includes(e.tier));
  if (valid.length === 0) return badRequest("no_tier_edits");

  const byTier = new Map(estimate.tiers.map((t) => [t.tier, t]));
  for (const e of valid) {
    const orig = byTier.get(e.tier);
    if (!orig) continue;
    const items = sanitizeLineItems(e.lineItems);
    if (items.length === 0) continue; // refuse to empty a whole tier
    byTier.set(e.tier, recomputeTier(orig, items, estimate.regionalFactor));
  }
  const newTiers: EstimateTier[] = estimate.tiers.map((t) => byTier.get(t.tier) ?? t);

  const selectedTier: Tier = TIER_KEYS.includes(body.selectedTier as Tier)
    ? (body.selectedTier as Tier)
    : estimate.selectedTier;
  const totalCents = newTiers.find((t) => t.tier === selectedTier)?.totalCents ?? estimate.totalCents;

  const updated = await store.updateEstimateTiers(id, newTiers, selectedTier, totalCents);
  return NextResponse.json({ estimate: updated, tiers: newTiers, selectedTier, totalCents });
}
