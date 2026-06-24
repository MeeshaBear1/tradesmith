import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
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

/* eslint-disable @typescript-eslint/no-explicit-any */

const toContractor = (r: any): Contractor => ({
  id: r.id,
  name: r.name,
  logoUrl: r.logo_url,
  brandColor: r.brand_color,
  phone: r.phone,
  email: r.email,
  licenseNo: r.license_no,
  passwordHash: r.password_hash ?? null,
  rateConfig: r.default_rate_card ?? null,
  createdAt: r.created_at,
});
const toJob = (r: any): Job => ({
  id: r.id,
  contractorId: r.contractor_id,
  vertical: r.vertical ?? "roofing",
  homeownerName: r.homeowner_name,
  homeownerEmail: r.homeowner_email,
  address: r.address,
  lat: r.lat,
  lng: r.lng,
  status: r.status,
  createdAt: r.created_at,
});
const toTakeoff = (r: any): Takeoff => ({
  id: r.id,
  jobId: r.job_id,
  contractorId: r.contractor_id,
  vertical: r.vertical,
  source: r.source,
  satelliteImageUrl: r.satellite_image_url,
  measurement: r.measurement,
  confidence: r.confidence ?? 0,
  renderStatus: r.render_status ?? "none",
  renderImageUrl: r.render_image_url ?? null,
  renderKey: r.render_key ?? null,
  renderPrompt: r.render_prompt ?? null,
  createdAt: r.created_at,
});
const toEstimate = (r: any): Estimate => ({
  id: r.id,
  jobId: r.job_id,
  contractorId: r.contractor_id,
  vertical: r.vertical ?? "roofing",
  takeoffId: r.takeoff_id,
  inputs: r.inputs ?? null,
  version: r.version,
  tiers: r.tiers,
  selectedTier: r.selected_tier,
  totalCents: r.total_cents,
  regionalFactor: r.regional_factor ?? 1,
  scopeMeta: r.scope_meta ?? null,
  createdAt: r.created_at,
});
const toProposal = (r: any): Proposal => ({
  id: r.id,
  jobId: r.job_id,
  contractorId: r.contractor_id,
  estimateId: r.estimate_id,
  publicToken: r.public_token,
  status: r.status,
  scopeCopy: r.scope_copy,
  signatureName: r.signature_name,
  acceptedAt: r.accepted_at,
  viewedAt: r.viewed_at ?? null,
  createdAt: r.created_at,
});
const toInvoice = (r: any): Invoice => ({
  id: r.id,
  jobId: r.job_id,
  contractorId: r.contractor_id,
  proposalId: r.proposal_id,
  publicToken: r.public_token,
  amountCents: r.amount_cents,
  depositCents: r.deposit_cents,
  type: r.type,
  status: r.status,
  stripePaymentIntentId: r.stripe_payment_intent_id,
  paidAt: r.paid_at,
  createdAt: r.created_at,
});
const toPayment = (r: any): Payment => ({
  id: r.id,
  invoiceId: r.invoice_id,
  contractorId: r.contractor_id,
  amountCents: r.amount_cents,
  stripeEventId: r.stripe_event_id,
  stripePaymentIntentId: r.stripe_payment_intent_id,
  status: r.status,
  createdAt: r.created_at,
});
const toFeedback = (r: any): Feedback => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  email: r.email,
  company: r.company,
  role: r.role,
  message: r.message,
  createdAt: r.created_at,
});
const toFinancing = (r: any): FinancingApplication => ({
  id: r.id,
  jobId: r.job_id,
  contractorId: r.contractor_id,
  amountCents: r.amount_cents,
  termMonths: r.term_months,
  apr: r.apr,
  monthlyPaymentCents: r.monthly_payment_cents,
  decision: r.decision,
  provider: r.provider,
  createdAt: r.created_at,
});

function one<T>(data: any, map: (r: any) => T): T | null {
  return data ? map(data) : null;
}

export class SupabaseStore implements Store {
  private db: SupabaseClient;
  constructor() {
    this.db = createAdminClient();
  }

  async getContractor(id: string) {
    const { data } = await this.db.from("contractors").select("*").eq("id", id).maybeSingle();
    return one(data, toContractor);
  }
  async getContractorByEmail(email: string) {
    const { data } = await this.db
      .from("contractors")
      .select("*")
      .ilike("email", email.trim())
      .limit(1)
      .maybeSingle();
    return one(data, toContractor);
  }
  async createContractor(input: NewContractor): Promise<Contractor> {
    const { data, error } = await this.db
      .from("contractors")
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        license_no: input.licenseNo,
        brand_color: input.brandColor || "#ea4e1c",
        logo_url: input.logoUrl,
        password_hash: input.passwordHash,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toContractor(data);
  }
  async updateContractorRateConfig(id: string, rateConfig: RateConfig) {
    const { data, error } = await this.db
      .from("contractors")
      .update({ default_rate_card: rateConfig })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return one(data, toContractor);
  }
  async updateContractorProfile(id: string, fields: ContractorProfileUpdate) {
    const patch: Record<string, unknown> = {};
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.email !== undefined) patch.email = fields.email;
    if (fields.phone !== undefined) patch.phone = fields.phone;
    if (fields.licenseNo !== undefined) patch.license_no = fields.licenseNo;
    if (fields.brandColor !== undefined) patch.brand_color = fields.brandColor;
    if (fields.logoUrl !== undefined) patch.logo_url = fields.logoUrl;
    const { data, error } = await this.db
      .from("contractors")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return one(data, toContractor);
  }

  async createJob(input: NewJob): Promise<Job> {
    const { data, error } = await this.db
      .from("jobs")
      .insert({
        contractor_id: input.contractorId,
        vertical: input.vertical,
        homeowner_name: input.homeownerName,
        homeowner_email: input.homeownerEmail,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toJob(data);
  }
  async getJob(id: string) {
    const { data } = await this.db.from("jobs").select("*").eq("id", id).maybeSingle();
    return one(data, toJob);
  }
  async listJobs(contractorId: string) {
    const { data } = await this.db
      .from("jobs")
      .select("*")
      .eq("contractor_id", contractorId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(toJob);
  }
  async updateJobStatus(id: string, status: JobStatus) {
    await this.db.from("jobs").update({ status }).eq("id", id);
  }
  async updateJob(id: string, fields: JobUpdate) {
    const patch: Record<string, unknown> = {};
    if (fields.homeownerName !== undefined) patch.homeowner_name = fields.homeownerName;
    if (fields.homeownerEmail !== undefined) patch.homeowner_email = fields.homeownerEmail;
    if (fields.address !== undefined) patch.address = fields.address;
    const { data, error } = await this.db.from("jobs").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw error;
    return one(data, toJob);
  }
  async deleteJob(id: string) {
    // FK `on delete cascade` removes takeoffs/estimates/proposals/invoices/payments.
    await this.db.from("jobs").delete().eq("id", id);
  }

  async createTakeoff(input: NewTakeoff): Promise<Takeoff> {
    const { data, error } = await this.db
      .from("takeoffs")
      .insert({
        job_id: input.jobId,
        contractor_id: input.contractorId,
        vertical: input.vertical,
        source: input.source,
        satellite_image_url: input.satelliteImageUrl,
        measurement: input.measurement,
        confidence: input.confidence,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toTakeoff(data);
  }
  async getLatestTakeoff(jobId: string) {
    const { data } = await this.db
      .from("takeoffs")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return one(data, toTakeoff);
  }
  async setTakeoffRender(id: string, fields: TakeoffRenderUpdate) {
    const patch: Record<string, unknown> = {};
    if (fields.renderStatus !== undefined) patch.render_status = fields.renderStatus;
    if (fields.renderImageUrl !== undefined) patch.render_image_url = fields.renderImageUrl;
    if (fields.renderKey !== undefined) patch.render_key = fields.renderKey;
    if (fields.renderPrompt !== undefined) patch.render_prompt = fields.renderPrompt;
    if (Object.keys(patch).length) await this.db.from("takeoffs").update(patch).eq("id", id);
  }

  async createEstimate(input: NewEstimate): Promise<Estimate> {
    // Retry on the unique(job_id, version) collision that a concurrent insert can cause.
    for (let attempt = 0; attempt < 4; attempt++) {
      const { count } = await this.db
        .from("estimates")
        .select("id", { count: "exact", head: true })
        .eq("job_id", input.jobId);
      const version = (count ?? 0) + 1;
      const { data, error } = await this.db
        .from("estimates")
        .insert({
          job_id: input.jobId,
          contractor_id: input.contractorId,
          vertical: input.vertical,
          takeoff_id: input.takeoffId,
          inputs: input.inputs,
          version,
          tiers: input.tiers,
          selected_tier: input.selectedTier,
          total_cents: input.totalCents,
          regional_factor: input.regionalFactor ?? 1,
          scope_meta: input.scopeMeta ?? null,
        })
        .select("*")
        .single();
      if (!error) return toEstimate(data);
      if (error.code !== "23505") throw error; // not a version collision
    }
    throw new Error("estimate_version_conflict");
  }
  async getEstimate(id: string) {
    const { data } = await this.db.from("estimates").select("*").eq("id", id).maybeSingle();
    return one(data, toEstimate);
  }
  async getLatestEstimate(jobId: string) {
    const { data } = await this.db
      .from("estimates")
      .select("*")
      .eq("job_id", jobId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    return one(data, toEstimate);
  }
  async setSelectedTier(estimateId: string, tier: Tier) {
    const est = await this.getEstimate(estimateId);
    const total = est?.tiers.find((t) => t.tier === tier)?.totalCents ?? est?.totalCents ?? 0;
    await this.db.from("estimates").update({ selected_tier: tier, total_cents: total }).eq("id", estimateId);
  }
  async updateEstimateTiers(
    estimateId: string,
    tiers: Estimate["tiers"],
    selectedTier: Tier,
    totalCents: number,
  ) {
    const { data, error } = await this.db
      .from("estimates")
      .update({ tiers, selected_tier: selectedTier, total_cents: totalCents })
      .eq("id", estimateId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return one(data, toEstimate);
  }

  async createProposal(input: NewProposal): Promise<Proposal> {
    const { nanoid } = await import("nanoid");
    const { data, error } = await this.db
      .from("proposals")
      .insert({
        job_id: input.jobId,
        contractor_id: input.contractorId,
        estimate_id: input.estimateId,
        public_token: nanoid(),
        status: "sent",
        scope_copy: input.scopeCopy,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toProposal(data);
  }
  async getProposalByToken(token: string) {
    const { data } = await this.db.from("proposals").select("*").eq("public_token", token).maybeSingle();
    return one(data, toProposal);
  }
  async getProposalById(id: string) {
    const { data } = await this.db.from("proposals").select("*").eq("id", id).maybeSingle();
    return one(data, toProposal);
  }
  async getProposalForJob(jobId: string) {
    const { data } = await this.db
      .from("proposals")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return one(data, toProposal);
  }
  async markProposalViewed(token: string) {
    // First open only: flip sent -> viewed and stamp the time.
    await this.db
      .from("proposals")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("public_token", token)
      .eq("status", "sent");
  }
  async acceptProposal(token: string, signatureName: string) {
    // Idempotent: only stamp a signature when not already accepted.
    const { data, error } = await this.db
      .from("proposals")
      .update({ status: "accepted", signature_name: signatureName, accepted_at: new Date().toISOString() })
      .eq("public_token", token)
      .neq("status", "accepted")
      .select("*")
      .maybeSingle();
    if (error) throw error;
    if (data) return toProposal(data);
    // Already accepted (update matched nothing) — return the existing row.
    return this.getProposalByToken(token);
  }

  async createInvoice(input: NewInvoice): Promise<Invoice> {
    const { nanoid } = await import("nanoid");
    const { data, error } = await this.db
      .from("invoices")
      .insert({
        job_id: input.jobId,
        contractor_id: input.contractorId,
        proposal_id: input.proposalId,
        public_token: nanoid(),
        amount_cents: input.amountCents,
        deposit_cents: input.depositCents,
        type: input.type,
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw error;
    return toInvoice(data);
  }
  async getInvoiceByToken(token: string) {
    const { data } = await this.db.from("invoices").select("*").eq("public_token", token).maybeSingle();
    return one(data, toInvoice);
  }
  async getInvoiceForProposal(proposalId: string) {
    const { data } = await this.db
      .from("invoices")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return one(data, toInvoice);
  }
  async setInvoicePaymentIntent(id: string, paymentIntentId: string) {
    await this.db.from("invoices").update({ stripe_payment_intent_id: paymentIntentId }).eq("id", id);
  }
  async markInvoicePaid(id: string) {
    await this.db.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
  }

  async createPayment(input: NewPayment): Promise<Payment> {
    const { data, error } = await this.db
      .from("payments")
      .insert({
        invoice_id: input.invoiceId,
        contractor_id: input.contractorId,
        amount_cents: input.amountCents,
        stripe_event_id: input.stripeEventId,
        stripe_payment_intent_id: input.stripePaymentIntentId,
        status: input.status,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toPayment(data);
  }
  async getPaymentByEventId(eventId: string) {
    const { data } = await this.db.from("payments").select("*").eq("stripe_event_id", eventId).maybeSingle();
    return one(data, toPayment);
  }

  async createFinancingApplication(input: NewFinancing): Promise<FinancingApplication> {
    const { data, error } = await this.db
      .from("financing_applications")
      .insert({
        job_id: input.jobId,
        contractor_id: input.contractorId,
        amount_cents: input.amountCents,
        term_months: input.termMonths,
        apr: input.apr,
        monthly_payment_cents: input.monthlyPaymentCents,
        decision: input.decision,
        provider: input.provider,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toFinancing(data);
  }

  async createFeedback(input: NewFeedback): Promise<Feedback> {
    const { data, error } = await this.db
      .from("feedback")
      .insert({
        kind: input.kind,
        name: input.name,
        email: input.email,
        company: input.company,
        role: input.role,
        message: input.message,
      })
      .select("*")
      .single();
    if (error) throw error;
    return toFeedback(data);
  }
  async listFeedback(): Promise<Feedback[]> {
    const { data } = await this.db.from("feedback").select("*").order("created_at", { ascending: false });
    return (data ?? []).map(toFeedback);
  }
}
