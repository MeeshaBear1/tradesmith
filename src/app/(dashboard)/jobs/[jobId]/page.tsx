import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { StatusBadge } from "@/components/badges";
import { JobActions } from "@/components/jobs/JobActions";
import { formatCents } from "@/lib/money";

export default async function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const contractor = await requireContractor();
  const store = await getStore();
  const job = await store.getJob(jobId);
  if (!job || job.contractorId !== contractor.id) notFound();

  const takeoff = await store.getLatestTakeoff(job.id);
  const estimate = await store.getLatestEstimate(job.id);
  const proposal = await store.getProposalForJob(job.id);
  const invoice = proposal ? await store.getInvoiceForProposal(proposal.id) : null;
  const selectedTier = estimate?.tiers.find((t) => t.tier === estimate.selectedTier);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-[var(--muted)] hover:underline">
        ← All jobs
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{job.homeownerName}</h1>
          <p className="text-sm text-[var(--muted)]">{job.address}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="mt-4">
        <JobActions
          jobId={job.id}
          companyName={contractor.name}
          homeownerName={job.homeownerName}
          homeownerEmail={job.homeownerEmail}
          address={job.address}
          proposalToken={proposal?.publicToken ?? null}
        />
      </div>

      <div className="mt-6 grid gap-4">
        {job.vertical === "roofing" && (
          <Section title="Takeoff">
            {takeoff ? (
              <div className="text-sm">
                <Detail k="Source" v={takeoff.source} />
                <Detail k="Footprint" v={`${Math.round(takeoff.measurement.detail.footprintSqft)} sq ft`} />
                <Detail k="Pitch" v={`${takeoff.measurement.detail.pitchX12}/12`} />
                <Detail k="Confidence" v={`${Math.round(takeoff.confidence * 100)}%`} />
              </div>
            ) : (
              <Empty>No takeoff yet. Start one in the New Job wizard.</Empty>
            )}
          </Section>
        )}

        <Section title="Estimate">
          {estimate && selectedTier ? (
            <div className="text-sm">
              <Detail k="Trade" v={job.vertical} />
              <Detail k="Selected" v={`${selectedTier.label} package`} />
              <Detail k="Total" v={formatCents(selectedTier.totalCents)} />
              <Detail k="Size" v={`${selectedTier.displayQty} ${selectedTier.displayUnit}`} />
            </div>
          ) : (
            <Empty>No estimate yet.</Empty>
          )}
        </Section>

        <Section title="Proposal & payment">
          {proposal ? (
            <div className="space-y-3 text-sm">
              <Detail k="Status" v={proposal.status} />
              <div className="flex flex-wrap gap-2">
                <a className="btn btn-ghost" href={`/p/${proposal.publicToken}`} target="_blank" rel="noreferrer">
                  Open proposal ↗
                </a>
                {invoice && (
                  <a className="btn btn-primary" href={`/pay/${invoice.publicToken}`} target="_blank" rel="noreferrer">
                    Open pay page ↗
                  </a>
                )}
              </div>
            </div>
          ) : (
            <Empty>No proposal yet.</Empty>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="label mb-3">{title}</div>
      {children}
    </div>
  );
}
function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--line)] py-1.5 last:border-0">
      <span className="text-[var(--muted)]">{k}</span>
      <span className="font-medium capitalize">{v}</span>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--muted)]">{children}</p>;
}
