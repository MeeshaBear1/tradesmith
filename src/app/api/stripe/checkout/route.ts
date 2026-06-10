import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { getStore } from "@/lib/db/store";
import { getStripe } from "@/lib/stripe/client";
import { badRequest, notFoundJson, readJson } from "@/lib/http";

/** Creates (or reuses) a test-mode PaymentIntent for the invoice deposit. */
export async function POST(req: Request) {
  const body = await readJson<{ invoiceToken: string }>(req);
  if (!body?.invoiceToken) return badRequest("missing_invoiceToken");

  const store = await getStore();
  const invoice = await store.getInvoiceByToken(body.invoiceToken);
  if (!invoice) return notFoundJson();
  if (invoice.status !== "open") return badRequest("invoice_not_open");

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ demo: true, amountCents: invoice.depositCents });
  }

  // Reuse an existing PaymentIntent for this invoice instead of spamming new ones.
  let clientSecret: string | null = null;
  if (invoice.stripePaymentIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId);
      if (["requires_payment_method", "requires_confirmation", "requires_action"].includes(existing.status)) {
        clientSecret = existing.client_secret;
      }
    } catch {
      // fall through to create a fresh one
    }
  }

  if (!clientSecret) {
    const pi = await stripe.paymentIntents.create({
      amount: invoice.depositCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { invoiceId: invoice.id, invoiceToken: invoice.publicToken },
      description: `Tradesmith deposit — invoice ${invoice.publicToken}`,
    });
    await store.setInvoicePaymentIntent(invoice.id, pi.id);
    clientSecret = pi.client_secret;
  }

  return NextResponse.json({
    demo: false,
    clientSecret,
    publishableKey: env.stripePublishable,
    amountCents: invoice.depositCents,
  });
}
