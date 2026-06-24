"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { jobBalance, clampInvoiceCharge } from "@/lib/invoicing";
import type { Invoice } from "@/lib/db/types";

const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function BillingPanel({
  jobId,
  contractTotalCents,
  invoices,
}: {
  jobId: string;
  contractTotalCents: number;
  invoices: Pick<Invoice, "id" | "type" | "status" | "depositCents" | "publicToken" | "createdAt">[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"progress" | "final">("progress");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = useMemo(
    () => jobBalance(contractTotalCents, invoices as Invoice[]),
    [contractTotalCents, invoices],
  );

  const requested = Math.round((Number(amount) || 0) * 100);
  const willCharge = clampInvoiceCharge(requested, balance);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: requested, type }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error === "not_accepted"
            ? "Bill after the homeowner accepts."
            : j.error === "nothing_to_bill"
              ? "Nothing left to bill on this job."
              : "Could not create the invoice.",
        );
        setBusy(false);
        return;
      }
      setAmount("");
      router.refresh();
      if (j.invoiceToken) window.open(`/pay/${j.invoiceToken}`, "_blank");
    } catch {
      setError("Could not create the invoice.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Contract" value={usd(balance.contractTotalCents)} />
        <Stat label="Collected" value={usd(balance.collectedCents)} tone="ok" />
        <Stat label="Open" value={usd(balance.openCents)} tone="warn" />
        <Stat label="Unbilled" value={usd(balance.unbilledCents)} />
      </div>

      {invoices.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-[var(--line)]">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2 last:border-0">
              <div>
                <span className="font-medium capitalize">{inv.type}</span>{" "}
                <span className="text-[var(--muted)]">· {inv.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums">{usd(inv.depositCents)}</span>
                {inv.status === "open" && (
                  <a className="font-medium" style={{ color: "var(--brand)" }} href={`/pay/${inv.publicToken}`} target="_blank" rel="noreferrer">
                    Pay link ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {balance.unbilledCents > 0 ? (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3">
          <div className="label mb-2">Bill a progress / final draw</div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[var(--muted)]">$</span>
            <input
              className="input w-32"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select className="input w-32" value={type} onChange={(e) => setType(e.target.value as "progress" | "final")}>
              <option value="progress">Progress</option>
              <option value="final">Final</option>
            </select>
            <button className="btn btn-primary" disabled={busy || willCharge <= 0} onClick={create}>
              {busy ? "Creating…" : "Create invoice"}
            </button>
          </div>
          {requested > 0 && willCharge < requested && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Capped to {usd(willCharge)} — that&apos;s all that&apos;s left on the contract.
            </p>
          )}
          {error && <p className="mt-2 text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        </div>
      ) : (
        <p className="text-[var(--muted)]">Fully invoiced. 🎉</p>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : "var(--ink)";
  return (
    <div className="rounded-lg border border-[var(--line)] p-2">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
