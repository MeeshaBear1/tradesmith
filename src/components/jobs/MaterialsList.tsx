"use client";

import { useState } from "react";
import type { EstimateTier } from "@/lib/takeoff/types";
import { buildSupplyList, supplyListText } from "@/lib/materials";

/** The crew's order/supply list, derived from the priced estimate. */
export function MaterialsList({ tier }: { tier: EstimateTier }) {
  const groups = buildSupplyList(tier);
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">Everything to order for this job.</p>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost text-xs"
            onClick={() => {
              navigator.clipboard?.writeText(supplyListText(tier));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy list"}
          </button>
          <button className="btn btn-ghost text-xs" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.heading}>
            <div className="label">{g.heading}</div>
            <table className="mt-1 w-full text-sm">
              <tbody className="divide-y divide-[var(--line)]">
                {g.items.map((it, i) => (
                  <tr key={i}>
                    <td className="py-1.5">{it.description}</td>
                    <td className="py-1.5 text-right tabular-nums text-[var(--muted)]">
                      {it.quantity} {it.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
