import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/config/env";
import { getStore } from "@/lib/db/store";
import { getStripe } from "@/lib/stripe/client";

/** Stripe webhook → records the payment idempotently and marks the invoice paid. */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ok: true, skipped: "no_stripe" });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", env.stripeWebhookSecret);
  } catch (err) {
    console.error("webhook signature verification failed:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const store = await getStore();
    if (await store.getPaymentByEventId(event.id)) {
      return NextResponse.json({ ok: true, idempotent: true });
    }
    const pi = event.data.object as Stripe.PaymentIntent;
    const token = pi.metadata?.invoiceToken;
    const invoice = token ? await store.getInvoiceByToken(token) : null;
    if (invoice && invoice.status !== "paid") {
      await store.createPayment({
        invoiceId: invoice.id,
        contractorId: invoice.contractorId,
        amountCents: pi.amount_received ?? pi.amount,
        stripeEventId: event.id,
        stripePaymentIntentId: pi.id,
        status: "succeeded",
      });
      await store.markInvoicePaid(invoice.id);
      await store.updateJobStatus(invoice.jobId, "paid");
    }
  }

  return NextResponse.json({ received: true });
}
