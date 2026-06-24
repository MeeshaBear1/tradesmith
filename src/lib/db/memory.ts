import { nanoid } from "nanoid";
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
import type { Tier } from "@/lib/takeoff/types";
import type { RateConfig } from "@/lib/verticals/types";
import { DEMO_CONTRACTOR, DEMO_SEED_JOBS } from "@/lib/db/demo";
import type {
  NewEstimate,
  NewFeedback,
  NewFinancing,
  NewInvoice,
  NewJob,
  NewPayment,
  ContractorProfileUpdate,
  JobUpdate,
  NewContractor,
  NewProposal,
  NewTakeoff,
  Store,
  TakeoffRenderUpdate,
} from "@/lib/db/store";

const now = () => new Date().toISOString();

class MemoryStore implements Store {
  contractors = new Map<string, Contractor>();
  jobs = new Map<string, Job>();
  takeoffs = new Map<string, Takeoff>();
  estimates = new Map<string, Estimate>();
  proposals = new Map<string, Proposal>();
  invoices = new Map<string, Invoice>();
  payments = new Map<string, Payment>();
  financing = new Map<string, FinancingApplication>();
  feedback = new Map<string, Feedback>();

  constructor() {
    this.contractors.set(DEMO_CONTRACTOR.id, DEMO_CONTRACTOR);
    let offset = 0;
    for (const seed of DEMO_SEED_JOBS) {
      const id = nanoid();
      offset += 1;
      this.jobs.set(id, {
        id,
        contractorId: DEMO_CONTRACTOR.id,
        vertical: seed.vertical,
        homeownerName: seed.homeownerName,
        homeownerEmail: seed.homeownerEmail,
        address: seed.address,
        lat: null,
        lng: null,
        status: seed.status,
        startDate: null,
        endDate: null,
        createdAt: new Date(Date.now() - offset * 86_400_000).toISOString(),
      });
    }
  }

  async getContractor(id: string) {
    return this.contractors.get(id) ?? null;
  }
  async getContractorByEmail(email: string) {
    const e = email.trim().toLowerCase();
    return [...this.contractors.values()].find((c) => (c.email ?? "").toLowerCase() === e) ?? null;
  }
  async createContractor(input: NewContractor): Promise<Contractor> {
    const c: Contractor = {
      id: nanoid(),
      name: input.name,
      logoUrl: input.logoUrl ?? null,
      brandColor: input.brandColor || "#ea4e1c",
      phone: input.phone ?? null,
      email: input.email ?? null,
      licenseNo: input.licenseNo ?? null,
      passwordHash: input.passwordHash ?? null,
      rateConfig: null,
      createdAt: now(),
    };
    this.contractors.set(c.id, c);
    return c;
  }
  async updateContractorRateConfig(id: string, rateConfig: RateConfig) {
    const c = this.contractors.get(id);
    if (!c) return null;
    c.rateConfig = rateConfig;
    return c;
  }
  async updateContractorProfile(id: string, fields: ContractorProfileUpdate) {
    const c = this.contractors.get(id);
    if (!c) return null;
    Object.assign(c, fields);
    return c;
  }

  async createJob(input: NewJob): Promise<Job> {
    const job: Job = { id: nanoid(), status: "new", createdAt: now(), startDate: null, endDate: null, ...input };
    this.jobs.set(job.id, job);
    return job;
  }
  async getJob(id: string) {
    return this.jobs.get(id) ?? null;
  }
  async listJobs(contractorId: string) {
    return [...this.jobs.values()]
      .filter((j) => j.contractorId === contractorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async updateJobStatus(id: string, status: JobStatus) {
    const j = this.jobs.get(id);
    if (j) j.status = status;
  }
  async updateJob(id: string, fields: JobUpdate) {
    const j = this.jobs.get(id);
    if (!j) return null;
    Object.assign(j, fields);
    return j;
  }
  async deleteJob(id: string) {
    this.jobs.delete(id);
    for (const [eid, e] of this.estimates) if (e.jobId === id) this.estimates.delete(eid);
    for (const [tid, t] of this.takeoffs) if (t.jobId === id) this.takeoffs.delete(tid);
    for (const [pid, p] of this.proposals) if (p.jobId === id) this.proposals.delete(pid);
    const invIds = new Set<string>();
    for (const [iid, inv] of this.invoices)
      if (inv.jobId === id) {
        invIds.add(inv.id);
        this.invoices.delete(iid);
      }
    for (const [pid, pay] of this.payments) if (invIds.has(pay.invoiceId)) this.payments.delete(pid);
    for (const [fid, f] of this.financing) if (f.jobId === id) this.financing.delete(fid);
  }

  async createTakeoff(input: NewTakeoff): Promise<Takeoff> {
    const t: Takeoff = {
      id: nanoid(),
      createdAt: now(),
      renderStatus: "none",
      renderImageUrl: null,
      renderKey: null,
      renderPrompt: null,
      ...input,
    };
    this.takeoffs.set(t.id, t);
    return t;
  }
  async getLatestTakeoff(jobId: string) {
    return (
      [...this.takeoffs.values()]
        .filter((t) => t.jobId === jobId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
    );
  }
  async setTakeoffRender(id: string, fields: TakeoffRenderUpdate) {
    const t = this.takeoffs.get(id);
    if (t) Object.assign(t, fields);
  }

  async createEstimate(input: NewEstimate): Promise<Estimate> {
    const version =
      [...this.estimates.values()].filter((e) => e.jobId === input.jobId).length + 1;
    const e: Estimate = {
      id: nanoid(),
      version,
      createdAt: now(),
      ...input,
      regionalFactor: input.regionalFactor ?? 1,
      scopeMeta: input.scopeMeta ?? null,
    };
    this.estimates.set(e.id, e);
    return e;
  }
  async getEstimate(id: string) {
    return this.estimates.get(id) ?? null;
  }
  async getLatestEstimate(jobId: string) {
    return (
      [...this.estimates.values()]
        .filter((e) => e.jobId === jobId)
        .sort((a, b) => b.version - a.version)[0] ?? null
    );
  }
  async setSelectedTier(estimateId: string, tier: Tier) {
    const e = this.estimates.get(estimateId);
    if (e) {
      e.selectedTier = tier;
      e.totalCents = e.tiers.find((t) => t.tier === tier)?.totalCents ?? e.totalCents;
    }
  }
  async updateEstimateTiers(
    estimateId: string,
    tiers: Estimate["tiers"],
    selectedTier: Tier,
    totalCents: number,
  ) {
    const e = this.estimates.get(estimateId);
    if (!e) return null;
    e.tiers = tiers;
    e.selectedTier = selectedTier;
    e.totalCents = totalCents;
    return e;
  }

  async createProposal(input: NewProposal): Promise<Proposal> {
    const p: Proposal = {
      id: nanoid(),
      publicToken: nanoid(),
      status: "sent",
      signatureName: null,
      signatureDataUrl: null,
      acceptedAt: null,
      viewedAt: null,
      createdAt: now(),
      ...input,
    };
    this.proposals.set(p.id, p);
    return p;
  }
  async listProposals(contractorId: string) {
    return [...this.proposals.values()]
      .filter((p) => p.contractorId === contractorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getProposalByToken(token: string) {
    return [...this.proposals.values()].find((p) => p.publicToken === token) ?? null;
  }
  async getProposalById(id: string) {
    return this.proposals.get(id) ?? null;
  }
  async getProposalForJob(jobId: string) {
    return (
      [...this.proposals.values()]
        .filter((p) => p.jobId === jobId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
    );
  }
  async markProposalViewed(token: string) {
    const p = await this.getProposalByToken(token);
    if (p && p.status === "sent") {
      p.status = "viewed";
      p.viewedAt = now();
    }
  }
  async acceptProposal(token: string, signatureName: string, signatureDataUrl?: string | null) {
    const p = await this.getProposalByToken(token);
    if (!p) return null;
    // Idempotent: never overwrite an existing signature/timestamp.
    if (p.status === "accepted") return p;
    p.status = "accepted";
    p.signatureName = signatureName;
    p.signatureDataUrl = signatureDataUrl ?? null;
    p.acceptedAt = now();
    return p;
  }

  async createInvoice(input: NewInvoice): Promise<Invoice> {
    const inv: Invoice = {
      id: nanoid(),
      publicToken: nanoid(),
      status: "open",
      stripePaymentIntentId: null,
      paidAt: null,
      createdAt: now(),
      ...input,
    };
    this.invoices.set(inv.id, inv);
    return inv;
  }
  async getInvoiceByToken(token: string) {
    return [...this.invoices.values()].find((i) => i.publicToken === token) ?? null;
  }
  async getInvoiceForProposal(proposalId: string) {
    return [...this.invoices.values()].find((i) => i.proposalId === proposalId) ?? null;
  }
  async listInvoicesForJob(jobId: string) {
    return [...this.invoices.values()]
      .filter((i) => i.jobId === jobId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async setInvoicePaymentIntent(id: string, paymentIntentId: string) {
    const inv = this.invoices.get(id);
    if (inv) inv.stripePaymentIntentId = paymentIntentId;
  }
  async markInvoicePaid(id: string) {
    const inv = this.invoices.get(id);
    if (inv) {
      inv.status = "paid";
      inv.paidAt = now();
    }
  }

  async createPayment(input: NewPayment): Promise<Payment> {
    const p: Payment = { id: nanoid(), createdAt: now(), ...input };
    this.payments.set(p.id, p);
    return p;
  }
  async getPaymentByEventId(eventId: string) {
    return [...this.payments.values()].find((p) => p.stripeEventId === eventId) ?? null;
  }

  async createFinancingApplication(input: NewFinancing): Promise<FinancingApplication> {
    const f: FinancingApplication = { id: nanoid(), createdAt: now(), ...input };
    this.financing.set(f.id, f);
    return f;
  }

  async createFeedback(input: NewFeedback): Promise<Feedback> {
    const f: Feedback = { id: nanoid(), createdAt: now(), ...input };
    this.feedback.set(f.id, f);
    return f;
  }
  async listFeedback(): Promise<Feedback[]> {
    return [...this.feedback.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

// Persist across hot-reloads / requests within one Node process.
const globalForStore = globalThis as unknown as { __tradesmithMemoryStore?: MemoryStore };

export function getMemoryStore(): MemoryStore {
  if (!globalForStore.__tradesmithMemoryStore) {
    globalForStore.__tradesmithMemoryStore = new MemoryStore();
  }
  return globalForStore.__tradesmithMemoryStore;
}
