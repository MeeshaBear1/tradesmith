"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { formatCents } from "@/lib/money";

interface FinancingOption {
  termMonths: number;
  apr: number;
  monthlyPaymentCents: number;
  label: string;
}

type Mode = "loading" | "demo" | "stripe" | "paid";

export function PayPanel({
  invoiceToken,
  depositCents,
  totalCents,
  alreadyPaid,
}: {
  invoiceToken: string;
  depositCents: number;
  totalCents: number;
  alreadyPaid: boolean;
}) {
  const [mode, setMode] = useState<Mode>(alreadyPaid ? "paid" : "loading");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [financeOpen, setFinanceOpen] = useState(false);

  useEffect(() => {
    if (alreadyPaid) return;
    (async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceToken }),
      });
      const data = await res.json();
      if (data.demo) {
        setMode("demo");
      } else {
        setClientSecret(data.clientSecret);
        setPubKey(data.publishableKey);
        setMode("stripe");
      }
    })();
  }, [invoiceToken, alreadyPaid]);

  const stripePromise = useMemo<Promise<Stripe | null> | null>(
    () => (pubKey ? loadStripe(pubKey) : null),
    [pubKey],
  );

  async function payDemo() {
    await fetch(`/api/invoice/${invoiceToken}/mark-paid`, { method: "POST" });
    setMode("paid");
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="label">Deposit due now (35%)</div>
            <div className="mt-1 text-3xl font-bold">{formatCents(depositCents)}</div>
            <div className="text-sm text-[var(--muted)]">of {formatCents(totalCents)} total</div>
          </div>
        </div>

        <div className="mt-5">
          {mode === "loading" && <p className="text-sm text-[var(--muted)]">Preparing secure checkout…</p>}

          {mode === "paid" && (
            <div className="rounded-xl p-4" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
              <div className="font-semibold">✓ Deposit paid — you&apos;re on the schedule.</div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                A receipt has been sent. Your crew lead will reach out to confirm a start date.
              </p>
            </div>
          )}

          {mode === "demo" && (
            <div>
              <p className="mb-3 text-sm text-[var(--muted)]">
                Demo mode — no Stripe keys configured. This simulates a successful card charge.
              </p>
              <button className="btn btn-primary w-full" onClick={payDemo}>
                Pay {formatCents(depositCents)} deposit (demo)
              </button>
            </div>
          )}

          {mode === "stripe" && stripePromise && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeForm invoiceToken={invoiceToken} amountCents={depositCents} onPaid={() => setMode("paid")} />
            </Elements>
          )}
        </div>
      </div>

      {mode !== "paid" && (
        <div className="card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Prefer to pay monthly?</div>
              <div className="text-sm text-[var(--muted)]">
                Finance the full {formatCents(totalCents)} — terms as low as same-as-cash.
              </div>
            </div>
            <button className="btn btn-ghost shrink-0" onClick={() => setFinanceOpen(true)}>
              Finance this roof
            </button>
          </div>
        </div>
      )}

      {financeOpen && (
        <FinancingModal
          invoiceToken={invoiceToken}
          totalCents={totalCents}
          onClose={() => setFinanceOpen(false)}
        />
      )}
    </div>
  );
}

function StripeForm({
  invoiceToken,
  amountCents,
  onPaid,
}: {
  invoiceToken: string;
  amountCents: number;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) {
      setError(error.message ?? "Payment failed");
      setBusy(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      // Server re-verifies the PaymentIntent with Stripe before marking paid,
      // so this works without a webhook listener and can't be spoofed.
      await fetch("/api/stripe/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceToken }),
      });
      onPaid();
    } else {
      setBusy(false);
    }
  }

  return (
    <div>
      <PaymentElement />
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
      <button className="btn btn-primary mt-4 w-full" disabled={busy || !stripe} onClick={submit}>
        {busy ? "Processing…" : `Pay ${formatCents(amountCents)} deposit`}
      </button>
      <p className="mt-2 text-center text-xs text-[var(--muted)]">
        Test mode — use card 4242 4242 4242 4242, any future date & CVC.
      </p>
    </div>
  );
}

function FinancingModal({
  invoiceToken,
  totalCents,
  onClose,
}: {
  invoiceToken: string;
  totalCents: number;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<FinancingOption[] | null>(null);
  const [decision, setDecision] = useState<"approved" | "declined" | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/financing/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceToken }),
      });
      const data = await res.json();
      setOptions(data.options);
      setDecision(data.decision);
    })();
  }, [invoiceToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Finance your roof</h3>
          <button className="text-[var(--muted)]" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Illustrative offers on {formatCents(totalCents)}. Soft check, no impact to credit.
        </p>

        {!options && <p className="mt-4 text-sm text-[var(--muted)]">Fetching offers…</p>}

        {options && !approved && (
          <>
            <div className="mt-4 space-y-2">
              {options.map((o) => (
                <div key={o.termMonths} className="flex items-center justify-between rounded-lg border border-[var(--line)] p-3">
                  <div>
                    <div className="text-sm font-semibold">{o.label}</div>
                    <div className="text-xs text-[var(--muted)]">{o.apr}% APR</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCents(o.monthlyPaymentCents)}</div>
                    <div className="text-xs text-[var(--muted)]">/mo</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary mt-4 w-full"
              disabled={decision !== "approved"}
              onClick={() => setApproved(true)}
            >
              {decision === "approved" ? "Get pre-approved →" : "Amount exceeds program limit"}
            </button>
          </>
        )}

        {approved && (
          <div className="mt-4 rounded-xl p-4 text-center" style={{ background: "var(--ok-soft)" }}>
            <div className="text-2xl">🎉</div>
            <div className="mt-1 font-semibold" style={{ color: "var(--ok)" }}>
              Pre-approved (illustrative)
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              A real lender hand-off (KYC + underwriting) plugs in here. Demo only — no application
              submitted.
            </p>
            <button className="btn btn-ghost mt-3" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
