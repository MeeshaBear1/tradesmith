import Link from "next/link";
import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { getVertical } from "@/lib/verticals/registry";
import { StatusBadge } from "@/components/badges";

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

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-sm text-[var(--muted)]">{jobs.length} total</p>
        </div>
        <Link href="/jobs/new" className="btn btn-primary">
          + New job
        </Link>
      </div>

      <div className="card mt-6 divide-y divide-[var(--line)]">
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
