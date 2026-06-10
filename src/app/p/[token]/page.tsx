import { notFound } from "next/navigation";
import { getStore } from "@/lib/db/store";
import type { Tier } from "@/lib/takeoff/types";
import { ProposalOffer } from "@/components/proposal/ProposalOffer";
import { PrintButton } from "@/components/proposal/PrintButton";

export const dynamic = "force-dynamic";

const DEPOSIT_PCT = 0.35;

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = await getStore();
  const proposal = await store.getProposalByToken(token);
  if (!proposal) notFound();

  const [job, estimate, contractor] = await Promise.all([
    store.getJob(proposal.jobId),
    store.getEstimate(proposal.estimateId),
    store.getContractor(proposal.contractorId),
  ]);
  if (!job || !estimate || !contractor) notFound();

  const [invoice, takeoff] = await Promise.all([
    store.getInvoiceForProposal(proposal.id),
    store.getLatestTakeoff(job.id),
  ]);

  const scope = proposal.scopeCopy;
  const initialTier: Tier = estimate.tiers.some((t) => t.tier === estimate.selectedTier)
    ? estimate.selectedTier
    : "better";
  const houseImageUrl = takeoff?.satelliteImageUrl ?? null;
  const renderImageUrl = takeoff?.renderStatus === "ready" ? takeoff.renderImageUrl : null;

  return (
    <div
      className="min-h-screen bg-[var(--paper)]"
      style={
        {
          ["--brand" as string]: contractor.brandColor,
          // Derive the soft/strong tints from the contractor's color so selected
          // chips, package cards, and the primary button stay on their brand.
          ["--brand-soft" as string]: `color-mix(in srgb, ${contractor.brandColor} 12%, white)`,
          ["--brand-strong" as string]: `color-mix(in srgb, ${contractor.brandColor} 82%, black)`,
        } as React.CSSProperties
      }
    >
      <header className="px-6 py-5 text-white" style={{ background: "var(--ink)" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {contractor.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contractor.logoUrl} alt={contractor.name} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
              style={{ background: "var(--brand)" }}
            >
              {contractor.name.slice(0, 1)}
            </div>
          )}
          <div>
            <div className="font-semibold">{contractor.name}</div>
            <div className="text-xs text-stone-400">
              {contractor.licenseNo} · {contractor.phone}
            </div>
          </div>
          <PrintButton className="ml-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="badge mb-3" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
          Proposal for {job.homeownerName}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{scope?.headline ?? "Roof Replacement Proposal"}</h1>
        <p className="mt-3 text-[var(--muted)] leading-relaxed">{scope?.intro}</p>

        {/* Scope story */}
        {scope?.sections?.length ? (
          <div className="mt-8 space-y-5">
            {scope.sections.map((s) => (
              <div key={s.title}>
                <h2 className="font-semibold">{s.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Interactive offer: finish preview · package selector · line items · e-sign */}
        <div className="mt-8">
          <ProposalOffer
            token={token}
            tiers={estimate.tiers}
            initialTier={initialTier}
            depositPct={DEPOSIT_PCT}
            vertical={job.vertical}
            address={job.address}
            accepted={proposal.status === "accepted"}
            signatureName={proposal.signatureName}
            invoiceToken={invoice?.publicToken ?? null}
            houseImageUrl={houseImageUrl}
            renderImageUrl={renderImageUrl}
          />
        </div>

        <p className="mt-8 text-center text-xs text-[var(--muted)]">
          Measurements are an AI-assisted estimate confirmed on-site. Prepared by {contractor.name}.
          Powered by Tradesmith.
        </p>
      </main>
    </div>
  );
}
