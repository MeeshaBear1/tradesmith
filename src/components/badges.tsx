import type { JobStatus } from "@/lib/db/types";
import type { ConfidenceBand } from "@/lib/takeoff/types";

const STATUS_STYLE: Record<JobStatus, { bg: string; fg: string; label: string }> = {
  new: { bg: "#f5f5f4", fg: "#57534e", label: "New" },
  measured: { bg: "#eff6ff", fg: "#1d4ed8", label: "Measured" },
  estimated: { bg: "var(--warn-soft)", fg: "var(--warn)", label: "Estimated" },
  proposed: { bg: "var(--brand-soft)", fg: "var(--brand)", label: "Proposed" },
  accepted: { bg: "var(--ok-soft)", fg: "var(--ok)", label: "Accepted" },
  invoiced: { bg: "var(--ok-soft)", fg: "var(--ok)", label: "Invoiced" },
  paid: { bg: "var(--ok)", fg: "#fff", label: "Paid" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

const BAND_STYLE: Record<ConfidenceBand, { bg: string; fg: string; label: string }> = {
  high: { bg: "var(--ok-soft)", fg: "var(--ok)", label: "AI measured" },
  medium: { bg: "var(--warn-soft)", fg: "var(--warn)", label: "AI estimate — verify" },
  low: { bg: "var(--danger-soft)", fg: "var(--danger)", label: "Low confidence — confirm" },
};

export function ConfidenceBadge({ band, confidence }: { band: ConfidenceBand; confidence: number }) {
  const s = BAND_STYLE[band];
  return (
    <span className="badge" style={{ background: s.bg, color: s.fg }}>
      {s.label} · {Math.round(confidence * 100)}%
    </span>
  );
}

export function IntegrationBadges({
  status,
}: {
  status: { anthropic: boolean; mapbox: boolean; stripe: boolean; supabase: boolean };
}) {
  const items: [string, boolean][] = [
    ["Claude vision", status.anthropic],
    ["Mapbox", status.mapbox],
    ["Stripe", status.stripe],
    ["Supabase", status.supabase],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([label, live]) => (
        <span
          key={label}
          className="badge"
          style={{
            background: live ? "var(--ok-soft)" : "#f5f5f4",
            color: live ? "var(--ok)" : "#a8a29e",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: live ? "var(--ok)" : "#d6d3d1" }}
          />
          {label} {live ? "live" : "demo"}
        </span>
      ))}
    </div>
  );
}
