/** Pure dashboard rollups from a contractor's jobs + their estimate totals. */
import type { JobStatus } from "@/lib/db/types";

const ACTIVE: JobStatus[] = ["new", "measured", "estimated", "proposed"];
const WON: JobStatus[] = ["accepted", "invoiced", "paid"];

export interface DashboardMetrics {
  totalJobs: number;
  byStage: Record<JobStatus, number>;
  pipelineValueCents: number;
  signedValueCents: number;
  depositsCollectedCents: number;
  avgJobCents: number;
  wonCount: number;
  closeRatePct: number;
}

export function computeDashboardMetrics(
  rows: { status: JobStatus; estTotalCents: number | null }[],
  depositPct = 0.35,
): DashboardMetrics {
  const byStage: Record<JobStatus, number> = {
    new: 0, measured: 0, estimated: 0, proposed: 0, accepted: 0, invoiced: 0, paid: 0,
  };
  let pipelineValueCents = 0;
  let signedValueCents = 0;
  let depositsCollectedCents = 0;
  let wonCount = 0;

  for (const r of rows) {
    byStage[r.status] += 1;
    const v = r.estTotalCents ?? 0;
    if (ACTIVE.includes(r.status)) pipelineValueCents += v;
    if (WON.includes(r.status)) {
      signedValueCents += v;
      wonCount += 1;
    }
    if (r.status === "paid") depositsCollectedCents += Math.round(v * depositPct);
  }

  const avgJobCents = wonCount ? Math.round(signedValueCents / wonCount) : 0;
  const closeDenom = byStage.proposed + wonCount;
  const closeRatePct = closeDenom ? Math.round((wonCount / closeDenom) * 100) : 0;

  return {
    totalJobs: rows.length,
    byStage,
    pipelineValueCents,
    signedValueCents,
    depositsCollectedCents,
    avgJobCents,
    wonCount,
    closeRatePct,
  };
}
