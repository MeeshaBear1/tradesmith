"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Tier } from "@/lib/takeoff/types";
import { SignaturePad } from "@/components/proposal/SignaturePad";

export function AcceptForm({
  token,
  accepted,
  signatureName,
  invoiceToken,
  selectedTier,
}: {
  token: string;
  accepted: boolean;
  signatureName: string | null;
  invoiceToken: string | null;
  selectedTier?: Tier;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (accepted) {
    return (
      <div className="card p-6" style={{ background: "var(--ok-soft)", borderColor: "var(--ok)" }}>
        <div className="font-semibold" style={{ color: "var(--ok)" }}>
          ✓ Accepted{signatureName ? ` by ${signatureName}` : ""}
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">Thank you! Your deposit invoice is ready.</p>
        {invoiceToken && (
          <a className="btn btn-primary mt-4" href={`/pay/${invoiceToken}`}>
            Pay deposit & schedule →
          </a>
        )}
      </div>
    );
  }

  async function accept() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proposal/${token}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signatureName: name, selectedTier }),
      });
      if (!res.ok) throw new Error("Could not accept");
      const { invoiceToken } = (await res.json()) as { invoiceToken: string };
      router.push(`/pay/${invoiceToken}`);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setBusy(false);
    }
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold">Accept this proposal</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Sign below and type your full name to e-sign. You&apos;ll then place a deposit to lock in your spot.
      </p>
      <div className="mt-4">
        <SignaturePad onChange={() => {}} />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="input"
          placeholder="Type your full name to confirm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary shrink-0" disabled={busy || !name.trim()} onClick={accept}>
          {busy ? "Accepting…" : "Accept & continue →"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
