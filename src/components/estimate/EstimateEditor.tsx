"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EstimateTier, ItemCategory, LineItem, Tier } from "@/lib/takeoff/types";

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "material", label: "Material" },
  { value: "labor", label: "Labor" },
  { value: "equipment", label: "Equipment" },
  { value: "fee", label: "Fee" },
];
const TIERS: Tier[] = ["good", "better", "best"];

const usd0 = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

interface Row {
  key: string;
  category: ItemCategory;
  description: string;
  quantity: string;
  unit: string;
  unitDollars: string;
}

function toRows(items: LineItem[]): Row[] {
  return items.map((i) => ({
    key: i.key,
    category: i.category,
    description: i.description,
    quantity: String(i.quantity),
    unit: i.unit,
    unitDollars: (i.unitCostCents / 100).toFixed(2),
  }));
}

const num = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export function EstimateEditor({
  estimateId,
  tiers,
  selectedTier,
  regionalFactor,
  markupRates,
  locked = false,
}: {
  estimateId: string;
  tiers: EstimateTier[];
  selectedTier: Tier;
  regionalFactor: number;
  /** [key,label,rate] of the markup stack, taken from the estimate's own tiers. */
  markupRates: { key: string; label: string; rate: number }[];
  locked?: boolean;
}) {
  const router = useRouter();
  const [tier, setTier] = useState<Tier>(selectedTier);
  const initialFor = (tk: Tier) => toRows(tiers.find((t) => t.tier === tk)?.lineItems ?? []);
  const [rows, setRows] = useState<Row[]>(initialFor(selectedTier));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function switchTier(tk: Tier) {
    setTier(tk);
    setRows(initialFor(tk));
    setMsg(null);
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }
  function add() {
    setRows((rs) => [
      ...rs,
      { key: `line_${rs.length + 1}`, category: "material", description: "", quantity: "1", unit: "ea", unitDollars: "0.00" },
    ]);
  }

  // Live preview that mirrors the server's compounding-markup math.
  const preview = useMemo(() => {
    const bucket = (c: ItemCategory) =>
      rows
        .filter((r) => r.category === c && num(r.quantity) > 0)
        .reduce((s, r) => s + Math.round(num(r.quantity) * Math.round(num(r.unitDollars) * 100)), 0);
    const material = bucket("material");
    const labor = bucket("labor");
    const equipment = bucket("equipment");
    const fee = bucket("fee");
    const base = material + labor + equipment + fee;
    let running = Math.round(base * regionalFactor);
    for (const m of markupRates) running += Math.round(running * m.rate);
    return { material, labor, equipment, fee, base, total: running };
  }, [rows, regionalFactor, markupRates]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const lineItems = rows
        .filter((r) => num(r.quantity) > 0)
        .map((r) => ({
          key: r.key,
          category: r.category,
          description: r.description.trim() || "Line item",
          quantity: num(r.quantity),
          unit: r.unit.trim() || "ea",
          unitCostCents: Math.round(num(r.unitDollars) * 100),
        }));
      if (lineItems.length === 0) {
        setMsg("Add at least one line before saving.");
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/estimate/${estimateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, lineItems, selectedTier: tier }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error === "estimate_locked" ? "Locked — the homeowner already signed." : "Could not save. Try again.");
        setSaving(false);
        return;
      }
      setMsg("Saved.");
      router.refresh();
    } catch {
      setMsg("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (locked) {
    return (
      <p className="text-sm text-[var(--muted)]">
        This estimate is locked — the homeowner has signed. Create a new job to re-quote.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--muted)]">Editing tier:</span>
        {TIERS.map((tk) => (
          <button
            key={tk}
            onClick={() => switchTier(tk)}
            className="rounded-full px-3 py-1 text-xs font-semibold capitalize transition"
            style={
              tk === tier
                ? { background: "var(--brand)", color: "#fff" }
                : { background: "var(--surface-sunken)", color: "var(--muted)" }
            }
          >
            {tk}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--muted)]">
              <th className="pb-1 font-medium">Line item</th>
              <th className="pb-1 font-medium">Type</th>
              <th className="pb-1 text-right font-medium">Qty</th>
              <th className="pb-1 font-medium">Unit</th>
              <th className="pb-1 text-right font-medium">$/unit</th>
              <th className="pb-1 text-right font-medium">Total</th>
              <th className="pb-1"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const lineCents = Math.round(num(r.quantity) * Math.round(num(r.unitDollars) * 100));
              return (
                <tr key={i} className="border-t border-[var(--line)]">
                  <td className="py-1 pr-2">
                    <input
                      className="w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1"
                      value={r.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="Description"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-1 py-1"
                      value={r.category}
                      onChange={(e) => update(i, { category: e.target.value as ItemCategory })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 pr-1">
                    <input
                      inputMode="decimal"
                      className="w-16 rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-right"
                      value={r.quantity}
                      onChange={(e) => update(i, { quantity: e.target.value })}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      className="w-16 rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1"
                      value={r.unit}
                      onChange={(e) => update(i, { unit: e.target.value })}
                    />
                  </td>
                  <td className="py-1 pr-1">
                    <input
                      inputMode="decimal"
                      className="w-24 rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1 text-right"
                      value={r.unitDollars}
                      onChange={(e) => update(i, { unitDollars: e.target.value })}
                    />
                  </td>
                  <td className="py-1 pr-1 text-right tabular-nums">{usd0(lineCents)}</td>
                  <td className="py-1 text-right">
                    <button
                      onClick={() => remove(i)}
                      className="text-[var(--muted)] hover:text-[var(--danger,#c0392b)]"
                      title="Remove line"
                      aria-label="Remove line"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={add} className="text-sm font-medium" style={{ color: "var(--brand)" }}>
        + Add line
      </button>

      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--muted)]">Subtotal (cost)</span>
          <span className="tabular-nums">{usd0(preview.base)}</span>
        </div>
        <div className="mt-1 flex justify-between font-semibold">
          <span>Estimate total ({tier})</span>
          <span className="tabular-nums">{usd0(preview.total)}</span>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Includes your markup stack ({markupRates.length} layers) and regional factor ×{regionalFactor}.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save estimate"}
        </button>
        {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
      </div>
    </div>
  );
}
