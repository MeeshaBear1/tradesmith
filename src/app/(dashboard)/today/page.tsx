import Link from "next/link";
import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { getVertical } from "@/lib/verticals/registry";
import { StatusBadge } from "@/components/badges";
import { computeDashboardMetrics } from "@/lib/metrics";
import { followupsFor } from "@/lib/reminders";
import { formatCents } from "@/lib/money";

/**
 * The mobile companion's home — a field-first cockpit for the contractor in the
 * truck or at the door. Hero action is the photo-to-quote flow; below it: today's
 * scheduled jobs, who needs a nudge, and the day's numbers. Lives in the dashboard
 * group, so it inherits the bottom-tab shell and works installed (PWA/Capacitor).
 */
export default async function TodayPage() {
  const contractor = await requireContractor();
  const store = await getStore();
  const jobs = await store.listJobs(contractor.id);

  const today = new Date().toISOString().slice(0, 10);
  const todays = jobs.filter((j) => j.startDate === today);

  const proposals = await store.listProposals(contractor.id);
  const followups = followupsFor(proposals, Date.now()).slice(0, 4);
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  const estimates = await Promise.all(jobs.map((j) => store.getLatestEstimate(j.id)));
  const m = computeDashboardMetrics(
    jobs.map((j, i) => ({ status: j.status, estTotalCents: estimates[i]?.totalCents ?? null })),
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <p className="text-sm text-[var(--muted)]">{greeting}</p>
        <h1 className="text-2xl font-bold tracking-tight">{contractor.name}</h1>
      </div>

      {/* Hero — quote a job from a photo */}
      <Link
        href="/today/quote"
        className="card-hero mt-5 flex items-center justify-between gap-4 p-5"
        style={{ background: "var(--ink)", color: "#fff" }}
      >
        <div>
          <div className="text-lg font-semibold">📷 Quote a job from a photo</div>
          <p className="mt-1 text-sm text-stone-300">
            Snap the room, confirm the lines, send the price — from the driveway.
          </p>
        </div>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
          style={{ background: "var(--brand)" }}
        >
          →
        </span>
      </Link>

      {/* Today's scheduled jobs */}
      <section className="mt-6">
        <div className="label mb-2">Today · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
        {todays.length === 0 ? (
          <div className="card p-5 text-sm text-[var(--muted)]">
            Nothing scheduled for today. Set start dates on a job to plan your crew.
          </div>
        ) : (
          <div className="card divide-y divide-[var(--line)]">
            {todays.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--paper)]">
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    <span className="mr-1.5">{getVertical(job.vertical).icon}</span>
                    {job.homeownerName}
                  </div>
                  <div className="truncate text-sm text-[var(--muted)]">{job.address}</div>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Needs follow-up */}
      {followups.length > 0 && (
        <section className="mt-6">
          <div className="label mb-2">Needs a nudge</div>
          <div className="card divide-y divide-[var(--line)]">
            {followups.map((f) => {
              const job = jobById.get(f.jobId);
              return (
                <Link key={f.proposalId} href={`/jobs/${f.jobId}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--paper)]">
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
        </section>
      )}

      {/* Day's numbers */}
      <section className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="Pipeline" value={formatCents(m.pipelineValueCents)} />
        <Stat label="Signed" value={formatCents(m.signedValueCents)} accent />
        <Stat label="Deposits" value={formatCents(m.depositsCollectedCents)} />
      </section>

      <div className="mt-6 flex gap-2">
        <Link href="/jobs/new" className="btn btn-ghost flex-1 justify-center">
          New job (full)
        </Link>
        <Link href="/dashboard" className="btn btn-ghost flex-1 justify-center">
          All jobs
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="display mt-0.5 text-lg tabular-nums" style={accent ? { color: "var(--brand)" } : undefined}>
        {value}
      </div>
    </div>
  );
}
