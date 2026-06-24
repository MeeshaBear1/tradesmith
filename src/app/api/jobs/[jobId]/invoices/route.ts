import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { clampInvoiceCharge, isProgressType, jobBalance } from "@/lib/invoicing";
import { badRequest, conflict, notFoundJson, readJson, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

/**
 * Create a progress or final invoice against an accepted job. The charge is clamped
 * server-side to what's still un-invoiced (never bills past the contract total), and
 * charges its full amount (unlike the 35% deposit). Tenant-scoped.
 */
export async function POST(req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();
  const { jobId } = await ctx.params;

  const body = await readJson<{ amountCents?: number; type?: string }>(req);
  const type = isProgressType(body?.type) ? body.type : "progress";

  const store = await getStore();
  const job = await store.getJob(jobId);
  if (!job || job.contractorId !== contractorId) return notFoundJson("job_not_found");

  const proposal = await store.getProposalForJob(jobId);
  if (!proposal || proposal.status !== "accepted") return conflict("not_accepted");
  const estimate = await store.getEstimate(proposal.estimateId);
  const contractTotal = estimate?.totalCents ?? 0;

  const invoices = await store.listInvoicesForJob(jobId);
  const balance = jobBalance(contractTotal, invoices);
  const charge = clampInvoiceCharge(Number(body?.amountCents) || 0, balance);
  if (charge <= 0) return badRequest("nothing_to_bill");

  const invoice = await store.createInvoice({
    jobId,
    contractorId,
    proposalId: proposal.id,
    amountCents: charge,
    depositCents: charge, // progress/final invoices collect their full amount
    type,
  });

  return NextResponse.json({ invoiceToken: invoice.publicToken, chargeCents: charge });
}
