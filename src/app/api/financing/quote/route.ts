import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { financingDecision, financingOptions } from "@/lib/financing";
import { badRequest, notFoundJson, readJson } from "@/lib/http";

/**
 * Mocked homeowner financing quote. Read-only and scoped to an invoice token —
 * the amount is taken from the server-owned invoice, never trusted from the client.
 */
export async function POST(req: Request) {
  const body = await readJson<{ invoiceToken: string }>(req);
  if (!body?.invoiceToken) return badRequest("missing_invoiceToken");

  const store = await getStore();
  const invoice = await store.getInvoiceByToken(body.invoiceToken);
  if (!invoice) return notFoundJson();

  const amountCents = invoice.amountCents;
  return NextResponse.json({
    decision: financingDecision(amountCents),
    amountCents,
    options: financingOptions(amountCents),
  });
}
