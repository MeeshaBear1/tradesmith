import { NextResponse } from "next/server";
import { hasKey } from "@/config/env";
import { getStore } from "@/lib/db/store";
import { forbidden, notFoundJson } from "@/lib/http";

/**
 * Demo-mode payment confirmation, used ONLY when Stripe is not configured.
 * When Stripe keys are present, "paid" is authoritative via the verified webhook
 * (or /api/stripe/confirm) — this endpoint is disabled to prevent spoofed payments.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  if (hasKey("stripe")) return forbidden("use_stripe");

  const { token } = await ctx.params;
  const store = await getStore();
  const invoice = await store.getInvoiceByToken(token);
  if (!invoice) return notFoundJson();
  if (invoice.status === "paid") return NextResponse.json({ ok: true, alreadyPaid: true });

  await store.markInvoicePaid(invoice.id);
  await store.updateJobStatus(invoice.jobId, "paid");
  return NextResponse.json({ ok: true });
}
