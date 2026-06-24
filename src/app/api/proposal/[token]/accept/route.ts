import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { badRequest, notFoundJson, readJson } from "@/lib/http";
import { depositCents, deriveAmountCents, resolveChosenTier } from "@/lib/proposals/deposit";

/** A drawn-signature data URL, validated + size-capped (~300KB) before it's stored. */
function sanitizeSignature(v: unknown): string | null {
  if (typeof v !== "string") return null;
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(v)) return null;
  return v.length > 400_000 ? null : v;
}

/** Public (no auth) — homeowner accepts + types their name, which mints a deposit invoice. */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = await readJson<{ signatureName?: string; selectedTier?: string; signatureDataUrl?: string }>(req);
  const signature = (body?.signatureName ?? "").trim();
  if (!signature) return badRequest("signature_required");
  const signatureDataUrl = sanitizeSignature(body?.signatureDataUrl);

  const store = await getStore();
  const existing = await store.getProposalByToken(token);
  if (!existing) return notFoundJson();
  if (existing.status === "declined") return badRequest("declined");

  // Idempotent: an already-accepted proposal returns its invoice without
  // re-stamping the signature, the tier, or regressing job status.
  if (existing.status === "accepted") {
    const inv = await store.getInvoiceForProposal(existing.id);
    if (inv) return NextResponse.json({ invoiceToken: inv.publicToken });
  }

  const proposal = await store.acceptProposal(token, signature, signatureDataUrl);
  if (!proposal) return notFoundJson();

  const estimate = await store.getEstimate(proposal.estimateId);

  // The homeowner's chosen tier governs the deposit — but only if it's a real,
  // allow-listed tier that exists in this estimate. Otherwise keep what was sent.
  const chosenTier = resolveChosenTier(body?.selectedTier, estimate?.tiers, estimate?.selectedTier ?? "better");

  if (estimate && chosenTier !== estimate.selectedTier) {
    await store.setSelectedTier(estimate.id, chosenTier);
  }

  // Re-derive the amount server-side from the chosen tier — never trust a client amount.
  const total = deriveAmountCents(estimate?.tiers, chosenTier, estimate?.totalCents ?? 0);

  let invoice = await store.getInvoiceForProposal(proposal.id);
  if (!invoice) {
    invoice = await store.createInvoice({
      jobId: proposal.jobId,
      contractorId: proposal.contractorId,
      proposalId: proposal.id,
      amountCents: total,
      depositCents: depositCents(total),
      type: "deposit",
    });
  }
  await store.updateJobStatus(proposal.jobId, "invoiced");

  return NextResponse.json({ invoiceToken: invoice.publicToken });
}
