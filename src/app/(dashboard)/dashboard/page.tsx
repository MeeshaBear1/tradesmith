import Link from "next/link";
import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { getVertical } from "@/lib/verticals/registry";
import { StatusBadge } from "@/components/badges";
import { computeDashboardMetrics } from "@/lib/metrics";
import { followupsFor } from "@/lib/reminders";
import type { JobStatus } from "@/lib/db/types";
import { formatCents } from "@/lib/money";

function timeAgo(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default async function DashboardPage() {
  const contractor = await requireContractor();
  const store = await getStore();
  const jobs = await store.listJobs(contractor.id);
  const estimates = await Promise.all(jobs.map((j) => store.getLatestEstimate(j.id)));
  const rows = jobs.map((j, i) => ({ status: j.status, estTotalCents: estimates[i]?.totalCents ?? null }));
  const m = computeDashboardMetrics(rows);

  const proposals = await store.listProposals(contractor.id);
  const followups = followupsFor(proposals, Date.now());
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--muted)]">
            {m.totalJobs} {m.totalJobs === 1 ? "job" : "jobs"} · {m.byStage.paid} paid
          </p>
        </div>
        <Link href="/jobs/new" className="btn btn-primary shrink-0">
          + New job
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Pipeline value" value={formatCents(m.pipelineValueCents)} sub="open jobs" />
        <Metric label="Signed" value={formatCents(m.signedValueCents)} sub={`${m.wonCount} won`} accent />
        <Metric label="Deposits in" value={formatCents(m.depositsCollectedCents)} sub="collected" />
        <Metric label="Close rate" value={`${m.closeRatePct}%`} sub={`avg ${formatCents(m.avgJobCents)}`} />
      </div>

      {m.totalJobs > 0 && <StageFunnel byStage={m.byStage} total={m.totalJobs} />}

      {followups.length > 0 && (
        <div className="card mt-3 p-4">
          <div className="label mb-3">Needs follow-up · {followups.length}</div>
          <div className="divide-y divide-[var(--line)]">
            {followups.slice(0, 6).map((f) => {
              const job = jobById.get(f.jobId);
              return (
                <Link
                  key={f.proposalId}
                  href={`/jobs/${f.jobId}`}
                  className="flex items-center justify-between gap-3 py-2 hover:opacity-80"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{job?.homeownerName ?? "Job"}</div>
                    <div className="truncate text-xs text-[var(--muted)]">{f.label}</div>
                  </div>
                  <span className="badge shrink-0" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                    {f.reason === "unopened" ? "Not opened" : "No signature"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-semibold">Recent jobs</h2>
        <Link href="/pipeline" className="text-sm font-medium text-[var(--brand)] hover:underline">
          Pipeline view →
        </Link>
      </div>

      <div className="card mt-2 divide-y divide-[var(--line)]">
        {jobs.length === 0 && (
          <div className="p-10 text-center text-sm text-[var(--muted)]">
            No jobs yet. Start one from an address.
          </div>
        )}
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--paper)]"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">
                <span className="mr-1.5">{getVertical(job.vertical).icon}</span>
                {job.homeownerName}
              </div>
              <div className="truncate text-sm text-[var(--muted)]">{job.address}</div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="hidden text-xs text-[var(--muted)] sm:block">{timeAgo(job.createdAt)}</span>
              <StatusBadge status={job.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="card p-4" style={accent ? { borderColor: "var(--brand)", boxShadow: "0 0 0 1px var(--brand)" } : undefined}>
      <div className="label">{label}</div>
      <div className="display mt-1 text-2xl tabular-nums" style={accent ? { color: "var(--brand)" } : undefined}>
        {value}
      </div>
      <div className="spec mt-0.5">{sub}</div>
    </div>
  );
}

const FUNNEL: { key: JobStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "measured", label: "Measured" },
  { key: "estimated", label: "Estimated" },
  { key: "proposed", label: "Proposed" },
  { key: "accepted", label: "Accepted" },
  { key: "invoiced", label: "Invoiced" },
  { key: "paid", label: "Paid" },
];

function StageFunnel({ byStage, total }: { byStage: Record<JobStatus, number>; total: number }) {
  return (
    <div className="card mt-3 p-4">
      <div className="label mb-3">Pipeline by stage</div>
      <div className="grid grid-cols-7 gap-1.5">
        {FUNNEL.map((s) => {
          const n = byStage[s.key];
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <div key={s.key} className="text-center">
              <div className="flex h-16 items-end justify-center">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max(6, pct)}%`,
                    background: n ? "var(--brand)" : "var(--line)",
                    opacity: n ? 1 : 0.5,
                  }}
                  title={`${n} ${s.label}`}
                />
              </div>
              <div className="mt-1 text-sm font-semibold tabular-nums">{n}</div>
              <div className="spec hidden sm:block" style={{ fontSize: "0.6rem" }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
