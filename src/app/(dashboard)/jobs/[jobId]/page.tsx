import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { StatusBadge } from "@/components/badges";
import { JobActions } from "@/components/jobs/JobActions";
import { MaterialsList } from "@/components/jobs/MaterialsList";
import { EstimateEditor } from "@/components/estimate/EstimateEditor";
import { BillingPanel } from "@/components/jobs/BillingPanel";
import { ScheduleEditor } from "@/components/jobs/ScheduleEditor";
import { QrCode } from "@/components/share/QrCode";
import { env } from "@/config/env";
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
  const invoices = proposal ? await store.listInvoicesForJob(job.id) : [];
  const selectedTier = estimate?.tiers.find((t) => t.tier === estimate.selectedTier);
  const contractTotalCents = estimate?.totalCents ?? 0;

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

      <div className="mt-3">
        <Link href={`/jobs/${job.id}/scope`} className="btn btn-ghost">
          📷 Quote from a photo
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        <Section title="Schedule">
          <ScheduleEditor jobId={job.id} startDate={job.startDate} endDate={job.endDate} />
        </Section>

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
            <div className="space-y-4">
              <div className="text-sm">
                <Detail k="Trade" v={job.vertical} />
                <Detail k="Selected" v={`${selectedTier.label} package`} />
                <Detail k="Total" v={formatCents(selectedTier.totalCents)} />
                <Detail k="Size" v={`${selectedTier.displayQty} ${selectedTier.displayUnit}`} />
              </div>

              {estimate.scopeMeta && (
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold capitalize">
                      {estimate.scopeMeta.roomType} · {estimate.scopeMeta.currentState}
                    </span>
                    <span
                      className="badge"
                      style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}
                    >
                      {estimate.scopeMeta.source === "ai" ? "AI scope" : "Template scope"} ·{" "}
                      {estimate.scopeMeta.confidenceBand}
                    </span>
                  </div>
                  <p className="mt-1 text-[var(--muted)]">{estimate.scopeMeta.remainingSummary}</p>
                  {estimate.scopeMeta.assumptions.length > 0 && (
                    <ul className="mt-2 list-disc pl-4 text-xs text-[var(--muted)]">
                      {estimate.scopeMeta.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <div className="label mb-2">Review &amp; edit lines</div>
                <EstimateEditor
                  estimateId={estimate.id}
                  tiers={estimate.tiers}
                  selectedTier={estimate.selectedTier}
                  regionalFactor={estimate.regionalFactor}
                  markupRates={selectedTier.markup.map((m) => ({ key: m.key, label: m.label, rate: m.rate }))}
                  locked={proposal?.status === "accepted"}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Empty>No estimate yet.</Empty>
              <Link href={`/jobs/${job.id}/scope`} className="btn btn-ghost">
                📷 Quote from a photo
              </Link>
            </div>
          )}
        </Section>

        {estimate && selectedTier && (
          <Section title="Materials & supply list">
            <MaterialsList tier={selectedTier} />
          </Section>
        )}

        <Section title="Proposal & payment">
          {proposal ? (
            <div className="space-y-4 text-sm">
              <Detail k="Status" v={proposal.status} />
              {proposal.status === "viewed" && (
                <div className="rounded-lg p-3" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                  <span className="font-semibold">Homeowner opened this</span>
                  {proposal.viewedAt ? ` · ${new Date(proposal.viewedAt).toLocaleString()}` : ""} — good time to
                  follow up.
                </div>
              )}
              {proposal.status === "accepted" && (
                <div className="rounded-lg p-3" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                  Accepted{proposal.signatureName ? ` by ${proposal.signatureName}` : ""}
                  {proposal.acceptedAt ? ` · ${new Date(proposal.acceptedAt).toLocaleDateString()}` : ""}.
                  {proposal.signatureDataUrl && (
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proposal.signatureDataUrl}
                        alt="Signature"
                        className="h-16 rounded border border-[var(--line)] bg-white p-1"
                      />
                    </div>
                  )}
                </div>
              )}
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
              <div className="flex flex-col items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 sm:flex-row sm:items-center sm:gap-4">
                <QrCode value={`${env.appUrl}/p/${proposal.publicToken}`} size={132} />
                <div className="text-center sm:text-left">
                  <div className="font-semibold">Show it on-site</div>
                  <p className="text-xs text-[var(--muted)]">
                    Have the homeowner scan this to open their proposal on their own phone.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Empty>No proposal yet.</Empty>
          )}
        </Section>

        {proposal?.status === "accepted" && (
          <Section title="Billing & balance">
            <BillingPanel jobId={job.id} contractTotalCents={contractTotalCents} invoices={invoices} />
          </Section>
        )}
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
