import Link from "next/link";
import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

export default async function PipelinePage() {
  const contractor = await requireContractor();
  const store = await getStore();
  const jobs = await store.listJobs(contractor.id);
  const board = jobs.map((j) => ({
    id: j.id,
    homeownerName: j.homeownerName,
    address: j.address,
    vertical: j.vertical,
    status: j.status,
    createdAt: j.createdAt,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-[var(--muted)]">
            Every job from first look to paid. Tap the arrows to move one along.
          </p>
        </div>
        <Link href="/jobs/new" className="btn btn-primary shrink-0">
          + New job
        </Link>
      </div>
      <div className="mt-6">
        <PipelineBoard jobs={board} />
      </div>
    </div>
  );
}
