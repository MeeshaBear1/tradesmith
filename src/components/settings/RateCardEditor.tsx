"use client";

import { useState } from "react";
import type { RateValue } from "@/lib/verticals/types";

export interface RateMeta {
  rateKey: string;
  label: string;
  unit: string;
  isTiered: boolean;
  current: RateValue;
}
export interface TradeMeta {
  key: string;
  label: string;
  icon: string;
  rates: RateMeta[];
}

const d = (cents: number) => (cents / 100).toString();
const c = (dollars: string) => Math.max(0, Math.round((Number(dollars) || 0) * 100));

export function RateCardEditor({
  trades,
  regionalFactor,
}: {
  trades: TradeMeta[];
  regionalFactor: number;
}) {
  // vals keyed by `${vertical}.${rateKey}` -> RateValue (cents)
  const initial: Record<string, RateValue> = {};
  for (const t of trades) for (const r of t.rates) initial[`${t.key}.${r.rateKey}`] = r.current;

  const [vals, setVals] = useState<Record<string, RateValue>>(initial);
  const [factor, setFactor] = useState(regionalFactor);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function setFlat(id: string, dollars: string) {
    setVals((v) => ({ ...v, [id]: c(dollars) }));
  }
  function setTier(id: string, tier: "good" | "better" | "best", dollars: string) {
    setVals((v) => {
      const cur = v[id];
      const obj = typeof cur === "object" ? { ...cur } : { good: 0, better: 0, best: 0 };
      obj[tier] = c(dollars);
      return { ...v, [id]: obj };
    });
  }

  async function save() {
    setState("saving");
    const rates: Record<string, Record<string, RateValue>> = {};
    for (const t of trades) {
      rates[t.key] = {};
      for (const r of t.rates) rates[t.key][r.rateKey] = vals[`${t.key}.${r.rateKey}`];
    }
    try {
      const res = await fetch("/api/rate-card", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ regionalFactor: factor, rates }),
      });
      if (!res.ok) throw new Error();
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rate card & pricing</h1>
          <p className="text-sm text-[var(--muted)]">
            These are realistic seed prices — tune them to your suppliers and crews. Costs are entered
            per unit; Good / Better / Best columns set material grade. Your markup is applied on top.
          </p>
        </div>
      </div>

      {/* Regional factor */}
      <div className="card mt-6 p-5">
        <div className="label">Regional cost factor</div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          A single multiplier on every estimate for your market. 1.00 = the seed defaults; e.g. 1.25 for a
          high-cost metro, 0.92 for a rural area.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            step="0.01"
            min="0.5"
            max="2.5"
            className="input w-32"
            value={factor}
            onChange={(e) => setFactor(Number(e.target.value) || 1)}
          />
          <span className="text-sm text-[var(--muted)]">× all costs</span>
        </div>
      </div>

      {/* Per-trade rates */}
      <div className="mt-5 space-y-3">
        {trades.map((t) => (
          <details key={t.key} className="card overflow-hidden p-0">
            <summary className="cursor-pointer list-none px-5 py-4 font-semibold">
              <span className="mr-2">{t.icon}</span>
              {t.label}
              <span className="ml-2 text-xs font-normal text-[var(--muted)]">{t.rates.length} rates</span>
            </summary>
            <div className="border-t border-[var(--line)] px-5 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--muted)]">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 text-right font-medium">Good $</th>
                    <th className="pb-2 text-right font-medium">Better $</th>
                    <th className="pb-2 text-right font-medium">Best $</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {t.rates.map((r) => {
                    const id = `${t.key}.${r.rateKey}`;
                    const val = vals[id];
                    return (
                      <tr key={id}>
                        <td className="py-1.5 pr-2">
                          {r.label}
                          <span className="ml-1 text-xs text-[var(--muted)]">/ {r.unit}</span>
                        </td>
                        {r.isTiered && typeof val === "object" ? (
                          (["good", "better", "best"] as const).map((tier) => (
                            <td key={tier} className="py-1 pl-2 text-right">
                              <input
                                type="number"
                                step="0.01"
                                className="input w-24 text-right"
                                value={d(val[tier])}
                                onChange={(e) => setTier(id, tier, e.target.value)}
                              />
                            </td>
                          ))
                        ) : (
                          <td colSpan={3} className="py-1 pl-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              className="input w-24 text-right"
                              value={d(typeof val === "number" ? val : 0)}
                              onChange={(e) => setFlat(id, e.target.value)}
                            />
                            <span className="ml-2 text-xs text-[var(--muted)]">(all tiers)</span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-3">
          <span className="text-sm text-[var(--muted)]">
            {state === "saved" ? "✓ Saved — new estimates use these rates." : "Changes apply to new estimates."}
          </span>
          <button className="btn btn-primary" onClick={save} disabled={state === "saving"}>
            {state === "saving" ? "Saving…" : "Save rate card"}
          </button>
        </div>
      </div>
      {state === "error" && (
        <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>Couldn&apos;t save — try again.</p>
      )}
    </div>
  );
}
