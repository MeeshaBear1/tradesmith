"use client";

import { useState } from "react";
import type { EstimateTier, Tier, Vertical } from "@/lib/takeoff/types";
import { formatCents } from "@/lib/money";
import { financingDecision, financingOptions } from "@/lib/financing";
import { materialBoard } from "@/lib/render/catalog";
import { AcceptForm } from "@/components/proposal/AcceptForm";

const TIER_PITCH: Record<Tier, string> = {
  good: "Quality materials, honest value.",
  better: "Upgraded materials + longer warranty.",
  best: "Premium materials, best curb appeal.",
};

function monthlyFromCents(totalCents: number): number | null {
  if (financingDecision(totalCents) !== "approved") return null;
  return Math.min(...financingOptions(totalCents).map((o) => o.monthlyPaymentCents));
}

function HouseGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 10.5 12 4l9 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProposalOffer({
  token,
  tiers,
  initialTier,
  depositPct,
  vertical,
  address,
  accepted,
  signatureName,
  invoiceToken,
  houseImageUrl,
  renderImageUrl,
}: {
  token: string;
  tiers: EstimateTier[];
  initialTier: Tier;
  depositPct: number;
  vertical: Vertical;
  address: string;
  accepted: boolean;
  signatureName: string | null;
  invoiceToken: string | null;
  houseImageUrl: string | null;
  renderImageUrl: string | null;
}) {
  const [tier, setTier] = useState<Tier>(initialTier);
  const [swatchName, setSwatchName] = useState<string | null>(null);

  const sel = tiers.find((t) => t.tier === tier) ?? tiers[0];
  const depositCents = Math.round(sel.totalCents * depositPct);
  const monthly = monthlyFromCents(sel.totalCents);

  const board = materialBoard(vertical, tier);
  const activeSwatch = board?.swatches.find((s) => s.name === swatchName) ?? board?.swatches[0] ?? null;

  // Prefer the AI "after" render when ready; otherwise the satellite/front photo;
  // otherwise the blueprint-grid panel. Never an empty gray box.
  const heroImg = renderImageUrl ?? houseImageUrl;

  return (
    <div className="space-y-6">
      {/* ---- Finish preview (Tier-1 swatch board) ---- */}
      <div className="card card-hero overflow-hidden">
        <div
          className="grid-blueprint relative flex h-44 items-center justify-center text-[var(--muted)]"
          style={
            heroImg
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(20,24,28,0) 45%, rgba(20,24,28,.55)), url(${heroImg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!heroImg && (
            <div className="flex flex-col items-center gap-2 text-center">
              <HouseGlyph />
              <div className="spec max-w-[16rem] truncate px-4">{address}</div>
            </div>
          )}
          {/* Honest provenance when the hero is an AI render */}
          {renderImageUrl && (
            <div
              className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold text-white"
              style={{ background: "rgba(20,24,28,.7)" }}
            >
              AI visualization
            </div>
          )}
          {/* Live finish tint chip */}
          {activeSwatch && (
            <div
              className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full px-3 py-1"
              style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
            >
              <span className="h-4 w-4 rounded-full border border-[var(--line)]" style={{ background: activeSwatch.hex }} />
              <span className="text-xs font-semibold">{activeSwatch.name}</span>
            </div>
          )}
        </div>

        <div className="p-5">
          {board ? (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-semibold">{board.material}</div>
                <div className="spec">{board.brand}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {board.swatches.map((s) => {
                  const on = s.name === activeSwatch?.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSwatchName(s.name)}
                      aria-pressed={on}
                      title={s.name}
                      className="group flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition"
                      style={{
                        borderColor: on ? "var(--brand)" : "var(--line)",
                        background: on ? "var(--brand-soft)" : "var(--surface)",
                        boxShadow: on ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-[var(--line)]"
                        style={{ background: s.hex }}
                      />
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Color preview — actual finish may vary; ask for a physical sample.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Material &amp; finish options for your {vertical} project are confirmed on-site with your sample selection.
            </p>
          )}
        </div>
      </div>

      {/* ---- Price + interactive tiers ---- */}
      <div className="card card-hero p-6">
        <div className="label">{sel.label} package</div>
        <div className="display tnum mt-1 text-4xl leading-none" style={{ color: "var(--brand)" }}>
          {formatCents(sel.totalCents)}
        </div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          {sel.displayQty} {sel.displayUnit} · {address}
        </div>

        {/* deposit + financing */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-[var(--line)] pt-4 text-sm">
          <div>
            <span className="text-[var(--muted)]">Deposit today ({Math.round(depositPct * 100)}%): </span>
            <span className="tnum font-semibold">{formatCents(depositCents)}</span>
          </div>
          {monthly != null && (
            <div>
              <span className="text-[var(--muted)]">or from </span>
              <span className="tnum font-semibold" style={{ color: "var(--trust)" }}>
                {formatCents(monthly)}/mo
              </span>
              <span className="text-[var(--muted)]">*</span>
            </div>
          )}
        </div>

        {/* tier selector */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {tiers.map((t) => {
            const on = t.tier === tier;
            const m = monthlyFromCents(t.totalCents);
            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => setTier(t.tier)}
                aria-pressed={on}
                className="relative rounded-[var(--radius-card)] border p-3 text-left transition"
                style={{
                  borderColor: on ? "var(--brand)" : "var(--line)",
                  background: on ? "var(--brand-soft)" : "var(--surface)",
                  boxShadow: on ? "var(--shadow-md)" : "none",
                  transform: on ? "translateY(-2px)" : "none",
                }}
              >
                {t.tier === "better" && (
                  <span
                    className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white"
                    style={{ background: "var(--brand)" }}
                  >
                    Most popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="label">{t.label}</span>
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full border"
                    style={{ borderColor: on ? "var(--brand)" : "var(--line)", background: on ? "var(--brand)" : "transparent" }}
                  >
                    {on && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4">
                        <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="tnum mt-1 text-lg font-bold">{formatCents(t.totalCents)}</div>
                {m != null && <div className="tnum text-xs text-[var(--muted)]">from {formatCents(m)}/mo</div>}
                <div className="mt-1 text-xs leading-snug text-[var(--muted)]">{TIER_PITCH[t.tier]}</div>
              </button>
            );
          })}
        </div>
        {monthly != null && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            *Illustrative monthly payment, subject to lender approval. Choose your package above — it updates your
            deposit and what&apos;s included.
          </p>
        )}
      </div>

      {/* ---- What's included (selected tier) ---- */}
      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          What&apos;s included in {sel.label} (line items)
        </summary>
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-[var(--line)]">
            {sel.lineItems.map((li) => (
              <tr key={li.key}>
                <td className="py-1.5">{li.description}</td>
                <td className="tnum py-1.5 text-right text-[var(--muted)]">
                  {li.quantity} {li.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      {/* ---- Accept (carries the chosen tier) ---- */}
      <AcceptForm
        token={token}
        accepted={accepted}
        signatureName={signatureName}
        invoiceToken={invoiceToken}
        selectedTier={tier}
      />
    </div>
  );
}
