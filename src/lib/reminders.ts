import type { Proposal } from "@/lib/db/types";

/**
 * Stale-proposal follow-ups. The dashboard already knows when a homeowner opened a
 * proposal (`viewedAt`); this turns that into "needs a nudge" so close-rate isn't
 * left on the table. Pure + deterministic (clock injected).
 */

export type FollowupReason = "unopened" | "viewed_no_action";

export interface Followup {
  proposalId: string;
  jobId: string;
  reason: FollowupReason;
  ageDays: number;
  label: string;
}

const DAY = 86_400_000;

export function daysSince(iso: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / DAY));
}

export function followupsFor(
  proposals: Proposal[],
  nowMs: number,
  opts: { unopenedDays?: number; viewedDays?: number } = {},
): Followup[] {
  const unopenedDays = opts.unopenedDays ?? 3;
  const viewedDays = opts.viewedDays ?? 2;
  const out: Followup[] = [];

  for (const p of proposals) {
    if (p.status === "accepted" || p.status === "declined") continue;
    if (p.status === "viewed" && p.viewedAt) {
      const age = daysSince(p.viewedAt, nowMs);
      if (age >= viewedDays) {
        out.push({
          proposalId: p.id,
          jobId: p.jobId,
          reason: "viewed_no_action",
          ageDays: age,
          label: `Opened ${age}d ago, not signed`,
        });
      }
    } else if (p.status === "sent") {
      const age = daysSince(p.createdAt, nowMs);
      if (age >= unopenedDays) {
        out.push({
          proposalId: p.id,
          jobId: p.jobId,
          reason: "unopened",
          ageDays: age,
          label: `Sent ${age}d ago, not opened`,
        });
      }
    }
  }
  // Most stale first — that's where the contractor should start.
  return out.sort((a, b) => b.ageDays - a.ageDays);
}
