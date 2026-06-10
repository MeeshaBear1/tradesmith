"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";
import { VERTICAL_LIST, getVertical } from "@/lib/verticals/registry";
import type { MeasureField, VerticalConfig } from "@/lib/verticals/types";
import type {
  Complexity,
  EstimateTier,
  Inputs,
  Measurement,
  RoofingDetail,
  Tier,
  Vertical,
} from "@/lib/takeoff/types";

const STEPS = ["Trade", "Address", "Measure", "Estimate", "Proposal"];

const num = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function defaultsFor(config: VerticalConfig): Inputs {
  return Object.fromEntries(config.fields.map((f) => [f.key, f.default]));
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
  return res.json();
}

export function NewJobWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vertical, setVertical] = useState<Vertical | null>(null);
  const config = vertical ? getVertical(vertical) : null;

  const [form, setForm] = useState({ homeownerName: "", homeownerEmail: "", address: "" });
  const [jobId, setJobId] = useState<string | null>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [detail, setDetail] = useState<RoofingDetail | null>(null);
  const [inputs, setInputs] = useState<Inputs>({});
  const [tiers, setTiers] = useState<EstimateTier[]>([]);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>("better");
  const [proposalToken, setProposalToken] = useState<string | null>(null);

  function chooseTrade(v: Vertical) {
    setVertical(v);
    setInputs(defaultsFor(getVertical(v)));
    setStep(2);
  }

  async function startJob() {
    if (!vertical) return;
    setError(null);
    setBusy(true);
    try {
      const { job } = await postJSON<{ job: { id: string } }>("/api/jobs", { ...form, vertical });
      setJobId(job.id);
      if (config?.measurementMode === "ai") {
        const { measurement } = await postJSON<{ measurement: Measurement }>("/api/takeoff/measure", {
          jobId: job.id,
        });
        setMeasurement(measurement);
        setDetail(measurement.detail);
      }
      setStep(3);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function buildEstimate() {
    if (!jobId || !config) return;
    setError(null);
    setBusy(true);
    try {
      const payload =
        config.measurementMode === "ai"
          ? { jobId, detail, selectedTier }
          : { jobId, inputs, selectedTier };
      const res = await postJSON<{ estimateId: string; tiers: EstimateTier[] }>("/api/estimate", payload);
      setTiers(res.tiers);
      setEstimateId(res.estimateId);
      setStep(4);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  async function createProposal() {
    if (!jobId || !estimateId) return;
    setError(null);
    setBusy(true);
    try {
      const { token } = await postJSON<{ token: string }>("/api/proposal", {
        jobId,
        estimateId,
        selectedTier,
      });
      setProposalToken(token);
      setStep(5);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  const selected = tiers.find((t) => t.tier === selectedTier);

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper step={step} />
      {error && (
        <div className="card mt-4 border-[var(--danger)] p-3 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* STEP 1 — Trade */}
      {step === 1 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">What kind of job?</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pick a trade. Roofing measures from satellite; the rest use a quick form. Same proposal &
            payment flow either way.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICAL_LIST.map((c) => (
              <button
                key={c.key}
                onClick={() => chooseTrade(c.key)}
                className="card p-4 text-left transition hover:border-[var(--brand)]"
              >
                <div className="text-2xl">{c.icon}</div>
                <div className="mt-2 font-semibold">{c.label}</div>
                <div className="text-xs text-[var(--muted)]">{c.blurb}</div>
                {c.measurementMode === "ai" && (
                  <span className="badge mt-2" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                    AI measured
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 — Address */}
      {step === 2 && config && (
        <div className="card mt-6 p-6">
          <div className="badge mb-2" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            {config.icon} {config.label}
          </div>
          <h2 className="text-lg font-semibold">Who&apos;s the customer?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Homeowner name">
              <input className="input" value={form.homeownerName} onChange={(e) => setForm({ ...form, homeownerName: e.target.value })} placeholder="Dana Whitfield" />
            </Field>
            <Field label="Homeowner email (optional)">
              <input className="input" value={form.homeownerEmail} onChange={(e) => setForm({ ...form, homeownerEmail: e.target.value })} placeholder="dana@example.com" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Property address">
                <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="4821 SE Lincoln St, Portland, OR 97215" />
              </Field>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={busy}>← Trade</button>
            <button className="btn btn-primary" disabled={busy || !form.homeownerName || !form.address} onClick={startJob}>
              {busy ? (config.measurementMode === "ai" ? "Measuring…" : "Saving…") : config.measurementMode === "ai" ? "Measure roof →" : "Enter measurements →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Measure (AI for roofing, form otherwise) */}
      {step === 3 && config?.measurementMode === "ai" && measurement && detail && (
        <MeasureStep measurement={measurement} detail={detail} setDetail={setDetail} busy={busy} onBack={() => setStep(2)} onContinue={buildEstimate} />
      )}
      {step === 3 && config?.measurementMode === "form" && (
        <FormMeasureStep config={config} inputs={inputs} setInputs={setInputs} busy={busy} onBack={() => setStep(2)} onContinue={buildEstimate} />
      )}

      {/* STEP 4 — Estimate */}
      {step === 4 && (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {tiers.map((t) => (
              <button
                key={t.tier}
                onClick={() => setSelectedTier(t.tier)}
                className="card p-4 text-left transition"
                style={{
                  borderColor: t.tier === selectedTier ? "var(--brand)" : undefined,
                  boxShadow: t.tier === selectedTier ? "0 0 0 1px var(--brand)" : undefined,
                }}
              >
                <div className="label">{t.label}</div>
                <div className="mt-1 text-2xl font-bold">{formatCents(t.totalCents)}</div>
                <div className="text-xs text-[var(--muted)]">{t.displayQty} {t.displayUnit}</div>
              </button>
            ))}
          </div>
          {selected && <TierBreakdown tier={selected} />}
          <div className="flex items-center justify-between">
            <button className="btn btn-ghost" onClick={() => setStep(3)} disabled={busy}>← Adjust</button>
            <button className="btn btn-primary" onClick={createProposal} disabled={busy}>
              {busy ? "Building…" : "Create branded proposal →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5 — Proposal ready */}
      {step === 5 && proposalToken && (
        <div className="card mt-6 p-6">
          <div className="badge" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>✓ Proposal ready</div>
          <h2 className="mt-3 text-lg font-semibold">Send it to the homeowner</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            This link opens a branded, e-signable proposal. Accepting it mints a deposit invoice with
            card payment and financing.
          </p>
          <ShareLink token={proposalToken} />
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="btn btn-primary" href={`/p/${proposalToken}`} target="_blank" rel="noreferrer">Open proposal ↗</a>
            <button className="btn btn-ghost" onClick={() => router.push("/dashboard")}>Back to jobs</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormMeasureStep({
  config,
  inputs,
  setInputs,
  busy,
  onBack,
  onContinue,
}: {
  config: VerticalConfig;
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
  busy: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="card mt-6 p-6">
      <h2 className="text-lg font-semibold">{config.label} measurements</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Enter the job details — we&apos;ll price it instantly.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {config.fields.map((f) => (
          <Field key={f.key} label={f.unit ? `${f.label} (${f.unit})` : f.label}>
            {f.type === "select" ? (
              <select
                className="input"
                value={String(inputs[f.key] ?? f.default)}
                onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })}
              >
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                className="input"
                value={Number(inputs[f.key] ?? f.default)}
                onChange={(e) => setInputs({ ...inputs, [f.key]: num(e.target.value) })}
              />
            )}
          </Field>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button className="btn btn-ghost" onClick={onBack} disabled={busy}>← Back</button>
        <button className="btn btn-primary" onClick={onContinue} disabled={busy}>
          {busy ? "Pricing…" : "Build estimate →"}
        </button>
      </div>
    </div>
  );
}

function MeasureStep({
  measurement,
  detail,
  setDetail,
  busy,
  onBack,
  onContinue,
}: {
  measurement: Measurement;
  detail: RoofingDetail;
  setDetail: (d: RoofingDetail) => void;
  busy: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const band = measurement.confidenceBand;
  const bandColor = band === "high" ? "var(--ok)" : band === "medium" ? "var(--warn)" : "var(--danger)";
  const bandSoft = band === "high" ? "var(--ok-soft)" : band === "medium" ? "var(--warn-soft)" : "var(--danger-soft)";

  return (
    <div className="card mt-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Roof measurement</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {measurement.source === "ai" ? "AI assist — confirm on-site." : "Enter the roof details."}
          </p>
        </div>
        <span className="badge" style={{ background: bandSoft, color: bandColor }}>
          {band === "high" ? "AI measured" : band === "medium" ? "Verify" : "Confirm"} · {Math.round(measurement.confidence * 100)}%
        </span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {measurement.satelliteImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={measurement.satelliteImageUrl} alt="Satellite view" className="aspect-square w-full rounded-xl border border-[var(--line)] object-cover" />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-6 text-center text-sm text-[var(--muted)]">
            No satellite imagery (demo / no Mapbox key). Enter the footprint and pitch manually — pricing still works.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Footprint (sq ft)">
            <input type="number" className="input" value={Math.round(detail.footprintSqft)} onChange={(e) => setDetail({ ...detail, footprintSqft: num(e.target.value) })} />
          </Field>
          <Field label="Pitch (x/12)">
            <input type="number" className="input" value={detail.pitchX12} onChange={(e) => setDetail({ ...detail, pitchX12: num(e.target.value), pitchSource: "user_override" })} />
          </Field>
          <Field label="Complexity">
            <select className="input" value={detail.complexity} onChange={(e) => setDetail({ ...detail, complexity: e.target.value as Complexity })}>
              <option value="simple">Simple</option>
              <option value="moderate">Moderate</option>
              <option value="complex">Complex</option>
            </select>
          </Field>
          <Field label="Stories">
            <input type="number" className="input" value={detail.stories} onChange={(e) => setDetail({ ...detail, stories: num(e.target.value) })} />
          </Field>
          <Field label="Existing layers">
            <input type="number" className="input" value={detail.existingLayers} onChange={(e) => setDetail({ ...detail, existingLayers: num(e.target.value) })} />
          </Field>
          <Field label="Facets">
            <input type="number" className="input" value={detail.facetCount} onChange={(e) => setDetail({ ...detail, facetCount: num(e.target.value) })} />
          </Field>
        </div>
      </div>

      {measurement.reasoning && <p className="mt-4 text-xs text-[var(--muted)] italic">“{measurement.reasoning}”</p>}
      {measurement.forceConfirm && (
        <p className="mt-2 text-xs" style={{ color: "var(--warn)" }}>
          ⚠ Please confirm footprint and pitch before quoting — {measurement.forceConfirmReasons.join(", ")}.
        </p>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button className="btn btn-ghost" onClick={onBack} disabled={busy}>← Back</button>
        <button className="btn btn-primary" onClick={onContinue} disabled={busy}>
          {busy ? "Pricing…" : "Build estimate →"}
        </button>
      </div>
    </div>
  );
}

function TierBreakdown({ tier }: { tier: EstimateTier }) {
  return (
    <div className="card p-5">
      <div className="label">{tier.label} package — line items</div>
      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-[var(--line)]">
          {tier.lineItems.map((li) => (
            <tr key={li.key}>
              <td className="py-1.5">{li.description}</td>
              <td className="py-1.5 text-right text-[var(--muted)]">{li.quantity} {li.unit}</td>
              <td className="py-1.5 text-right tabular-nums">{formatCents(li.lineCostCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-1 border-t border-[var(--line)] pt-3 text-sm">
        <Row label="Base cost" value={formatCents(tier.baseCents)} />
        {tier.markup.map((m) => (
          <Row key={m.key} label={`${m.label} (${Math.round(m.rate * 100)}%)`} value={formatCents(m.amountCents)} muted />
        ))}
        <Row label="Total" value={formatCents(tier.totalCents)} bold />
      </div>
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={muted ? "text-[var(--muted)]" : ""}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: done || active ? "var(--brand)" : "var(--line)", color: done || active ? "#fff" : "var(--muted)" }}
            >
              {done ? "✓" : n}
            </div>
            <span className={`text-sm ${active ? "font-semibold" : "text-[var(--muted)]"}`}>{s}</span>
            {n < STEPS.length && <span className="mx-1 h-px w-5 bg-[var(--line)]" />}
          </div>
        );
      })}
    </div>
  );
}

function ShareLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${token}` : `/p/${token}`;
  return (
    <div className="mt-4 flex items-center gap-2">
      <input className="input font-mono text-xs" readOnly value={url} />
      <button
        className="btn btn-ghost shrink-0"
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
