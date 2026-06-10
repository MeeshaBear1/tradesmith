import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getStripe } from "@/lib/stripe/client";
import { badRequest, notFoundJson, readJson } from "@/lib/http";

/**
 * Server-verified payment confirmation. The client calls this after a successful
 * Stripe Elements confirm; we re-check the PaymentIntent status with Stripe before
 * marking paid (so the client can never spoof "paid"). Safe even without a webhook
 * listener; idempotent against the webhook via invoice status + a synthetic event id.
 */
export async function POST(req: Request) {
  const body = await readJson<{ invoiceToken: string }>(req);
  if (!body?.invoiceToken) return badRequest("missing_invoiceToken");

  const store = await getStore();
  const invoice = await store.getInvoiceByToken(body.invoiceToken);
  if (!invoice) return notFoundJson();
  if (invoice.status === "paid") return NextResponse.json({ paid: true });

  const stripe = getStripe();
  if (!stripe || !invoice.stripePaymentIntentId) return badRequest("no_payment_intent");

  const pi = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId);
  if (pi.status !== "succeeded") return NextResponse.json({ paid: false, status: pi.status });

  const eventId = `confirm_${pi.id}`;
  if (!(await store.getPaymentByEventId(eventId))) {
    await store.createPayment({
      invoiceId: invoice.id,
      contractorId: invoice.contractorId,
      amountCents: pi.amount_received ?? pi.amount,
      stripeEventId: eventId,
      stripePaymentIntentId: pi.id,
      status: "succeeded",
    });
  }
  await store.markInvoicePaid(invoice.id);
  await store.updateJobStatus(invoice.jobId, "paid");
  return NextResponse.json({ paid: true });
}
