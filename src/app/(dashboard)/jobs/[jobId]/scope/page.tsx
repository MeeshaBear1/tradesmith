import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { ScopeCapture } from "@/components/scope/ScopeCapture";

export default async function ScopePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const contractor = await requireContractor();
  const store = await getStore();
  const job = await store.getJob(jobId);
  if (!job || job.contractorId !== contractor.id) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/jobs/${jobId}`} className="text-sm text-[var(--muted)] hover:underline">
        ← Back to job
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Quote from a photo</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {job.homeownerName} · {job.address}
      </p>
      <div className="mt-5">
        <ScopeCapture jobId={jobId} />
      </div>
    </div>
  );
}
