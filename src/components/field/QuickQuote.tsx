"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TRADES = [
  { value: "remodel", label: "Remodel / interior" },
  { value: "roofing", label: "Roofing" },
  { value: "siding", label: "Siding" },
  { value: "flooring", label: "Flooring" },
  { value: "painting", label: "Painting" },
  { value: "drywall", label: "Drywall" },
];

/** Field fast-path: capture the bare minimum, then jump straight to photo scope. */
export function QuickQuote() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [vertical, setVertical] = useState("remodel");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!name.trim() || !address.trim()) {
      setError("Add a homeowner name and address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeownerName: name.trim(), address: address.trim(), vertical }),
      });
      if (!res.ok) {
        setError("Could not start the job. Try again.");
        setBusy(false);
        return;
      }
      const { job } = (await res.json()) as { job: { id: string } };
      router.push(`/jobs/${job.id}/scope`);
    } catch {
      setError("Could not start the job. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Homeowner</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dana Ruiz" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Address</span>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Trade</span>
          <select className="input" value={vertical} onChange={(e) => setVertical(e.target.value)}>
            {TRADES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

      <button onClick={start} disabled={busy} className="btn btn-primary w-full">
        {busy ? "Starting…" : "📷 Next: photograph the space →"}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        You&apos;ll snap photos and get an editable Good/Better/Best quote in one pass.
      </p>
    </div>
  );
}
