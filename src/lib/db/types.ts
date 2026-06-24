import type { EstimateTier, Inputs, Measurement, Tier, Vertical } from "@/lib/takeoff/types";
import type { RateConfig } from "@/lib/verticals/types";

export type JobStatus =
  | "new"
  | "measured"
  | "estimated"
  | "proposed"
  | "accepted"
  | "invoiced"
  | "paid";

export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "declined";
export type InvoiceStatus = "open" | "paid" | "void";
export type InvoiceType = "deposit" | "progress" | "final";

export interface Contractor {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColor: string;
  phone: string | null;
  email: string | null;
  licenseNo: string | null;
  /** Pilot-grade auth: scrypt `salt:hash`. Null for the demo tenant (bypass login). */
  passwordHash: string | null;
  rateConfig: RateConfig | null;
  createdAt: string;
}

export interface Job {
  id: string;
  contractorId: string;
  vertical: Vertical;
  homeownerName: string;
  homeownerEmail: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  status: JobStatus;
  /** Optional scheduled start/end dates (YYYY-MM-DD) for crew planning. */
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export type RenderStatus = "none" | "pending" | "ready" | "failed";

export interface Takeoff {
  id: string;
  jobId: string;
  contractorId: string;
  vertical: Vertical;
  source: string;
  satelliteImageUrl: string | null;
  measurement: Measurement;
  confidence: number;
  /** AI img2img "after" render (Gemini). `none` until requested; swatch board is the fallback. */
  renderStatus: RenderStatus;
  renderImageUrl: string | null;
  /** Cache key `vertical:tier:color` — a re-request with the same finish is a no-op. */
  renderKey: string | null;
  renderPrompt: string | null;
  createdAt: string;
}

export interface ScopeCopy {
  headline: string;
  intro: string;
  sections: { title: string; body: string }[];
}

/** Human-facing context captured when an estimate is built from a photo scope. */
export interface ScopeMeta {
  roomType: string;
  currentState: string;
  floorSqft: number;
  currentStateSummary: string;
  remainingSummary: string;
  assumptions: string[];
  confidence: number;
  confidenceBand: string;
  source: "ai" | "template";
}

export interface Estimate {
  id: string;
  jobId: string;
  contractorId: string;
  vertical: Vertical;
  takeoffId: string | null;
  inputs: Inputs | null;
  version: number;
  tiers: EstimateTier[];
  selectedTier: Tier;
  totalCents: number;
  /** Regional factor used to price this estimate, so a line-item edit re-derives exactly. */
  regionalFactor: number;
  /** Present when this estimate came from a photo scope; powers the review UI + proposal copy. */
  scopeMeta: ScopeMeta | null;
  createdAt: string;
}

export interface Proposal {
  id: string;
  jobId: string;
  contractorId: string;
  estimateId: string;
  publicToken: string;
  status: ProposalStatus;
  scopeCopy: ScopeCopy | null;
  signatureName: string | null;
  /** Data URL (PNG) of the drawn signature, captured at acceptance. */
  signatureDataUrl: string | null;
  acceptedAt: string | null;
  /** First time the homeowner opened the proposal link (open-tracking). */
  viewedAt: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  contractorId: string;
  proposalId: string;
  publicToken: string;
  amountCents: number;
  depositCents: number;
  type: InvoiceType;
  status: InvoiceStatus;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  contractorId: string;
  amountCents: number;
  stripeEventId: string;
  stripePaymentIntentId: string | null;
  status: string;
  createdAt: string;
}

export interface FinancingApplication {
  id: string;
  jobId: string;
  contractorId: string;
  amountCents: number;
  termMonths: number;
  apr: number;
  monthlyPaymentCents: number;
  decision: "approved" | "declined";
  provider: string;
  createdAt: string;
}

export type FeedbackKind = "waitlist" | "feedback" | "demo_request";

export interface Feedback {
  id: string;
  kind: FeedbackKind;
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  message: string | null;
  createdAt: string;
}
