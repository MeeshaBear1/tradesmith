import { hasKey } from "@/config/env";
import type {
  Contractor,
  Estimate,
  Feedback,
  FinancingApplication,
  Invoice,
  Job,
  JobStatus,
  Payment,
  Proposal,
  Takeoff,
} from "@/lib/db/types";
import type { EstimateTier, Tier } from "@/lib/takeoff/types";
import type { RateConfig } from "@/lib/verticals/types";
import type { RenderStatus } from "@/lib/db/types";

export type TakeoffRenderUpdate = Partial<{
  renderStatus: RenderStatus;
  renderImageUrl: string | null;
  renderKey: string | null;
  renderPrompt: string | null;
}>;

export type NewContractor = Pick<
  Contractor,
  "name" | "email" | "phone" | "licenseNo" | "brandColor" | "logoUrl" | "passwordHash"
>;
export type ContractorProfileUpdate = Partial<
  Pick<Contractor, "name" | "email" | "phone" | "licenseNo" | "brandColor" | "logoUrl">
>;

export type NewJob = Pick<
  Job,
  "contractorId" | "vertical" | "homeownerName" | "homeownerEmail" | "address" | "lat" | "lng"
>;
export type JobUpdate = Partial<
  Pick<Job, "homeownerName" | "homeownerEmail" | "address" | "startDate" | "endDate">
>;
export type NewTakeoff = Pick<
  Takeoff,
  "jobId" | "contractorId" | "vertical" | "source" | "satelliteImageUrl" | "measurement" | "confidence"
>;
export type NewEstimate = Pick<
  Estimate,
  "jobId" | "contractorId" | "vertical" | "takeoffId" | "inputs" | "tiers" | "selectedTier" | "totalCents"
> &
  Partial<Pick<Estimate, "regionalFactor" | "scopeMeta">>;
export type NewProposal = Pick<Proposal, "jobId" | "contractorId" | "estimateId" | "scopeCopy">;
export type NewInvoice = Pick<Invoice, "jobId" | "contractorId" | "proposalId" | "amountCents" | "depositCents" | "type">;
export type NewPayment = Pick<
  Payment,
  "invoiceId" | "contractorId" | "amountCents" | "stripeEventId" | "stripePaymentIntentId" | "status"
>;
export type NewFinancing = Pick<
  FinancingApplication,
  "jobId" | "contractorId" | "amountCents" | "termMonths" | "apr" | "monthlyPaymentCents" | "decision" | "provider"
>;
export type NewFeedback = Pick<Feedback, "kind" | "name" | "email" | "company" | "role" | "message">;

export interface Store {
  getContractor(id: string): Promise<Contractor | null>;
  getContractorByEmail(email: string): Promise<Contractor | null>;
  createContractor(input: NewContractor): Promise<Contractor>;
  updateContractorRateConfig(id: string, rateConfig: RateConfig): Promise<Contractor | null>;
  updateContractorProfile(id: string, fields: ContractorProfileUpdate): Promise<Contractor | null>;

  createJob(input: NewJob): Promise<Job>;
  getJob(id: string): Promise<Job | null>;
  listJobs(contractorId: string): Promise<Job[]>;
  updateJobStatus(id: string, status: JobStatus): Promise<void>;
  updateJob(id: string, fields: JobUpdate): Promise<Job | null>;
  deleteJob(id: string): Promise<void>;

  createTakeoff(input: NewTakeoff): Promise<Takeoff>;
  getLatestTakeoff(jobId: string): Promise<Takeoff | null>;
  setTakeoffRender(id: string, fields: TakeoffRenderUpdate): Promise<void>;

  createEstimate(input: NewEstimate): Promise<Estimate>;
  getEstimate(id: string): Promise<Estimate | null>;
  getLatestEstimate(jobId: string): Promise<Estimate | null>;
  setSelectedTier(estimateId: string, tier: Tier): Promise<void>;
  /** Replace an estimate's tiers after a line-item edit; total is re-derived server-side. */
  updateEstimateTiers(
    estimateId: string,
    tiers: EstimateTier[],
    selectedTier: Tier,
    totalCents: number,
  ): Promise<Estimate | null>;

  createProposal(input: NewProposal): Promise<Proposal>;
  getProposalByToken(token: string): Promise<Proposal | null>;
  getProposalById(id: string): Promise<Proposal | null>;
  getProposalForJob(jobId: string): Promise<Proposal | null>;
  listProposals(contractorId: string): Promise<Proposal[]>;
  markProposalViewed(token: string): Promise<void>;
  acceptProposal(token: string, signatureName: string, signatureDataUrl?: string | null): Promise<Proposal | null>;

  createInvoice(input: NewInvoice): Promise<Invoice>;
  getInvoiceByToken(token: string): Promise<Invoice | null>;
  getInvoiceForProposal(proposalId: string): Promise<Invoice | null>;
  listInvoicesForJob(jobId: string): Promise<Invoice[]>;
  setInvoicePaymentIntent(id: string, paymentIntentId: string): Promise<void>;
  markInvoicePaid(id: string): Promise<void>;

  createPayment(input: NewPayment): Promise<Payment>;
  getPaymentByEventId(eventId: string): Promise<Payment | null>;

  createFinancingApplication(input: NewFinancing): Promise<FinancingApplication>;

  createFeedback(input: NewFeedback): Promise<Feedback>;
  listFeedback(): Promise<Feedback[]>;
}

let cached: Store | null = null;

/** Supabase-backed when keys are present; otherwise an in-memory demo store. */
export async function getStore(): Promise<Store> {
  if (cached) return cached;
  if (hasKey("supabase")) {
    const { SupabaseStore } = await import("@/lib/db/supabase-store");
    cached = new SupabaseStore();
  } else {
    const { getMemoryStore } = await import("@/lib/db/memory");
    cached = getMemoryStore();
  }
  return cached;
}
