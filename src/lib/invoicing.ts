import type { Invoice, InvoiceType } from "@/lib/db/types";

/**
 * Job billing math. A job's contract value is its accepted estimate total. Each
 * invoice charges `depositCents` (that's what the pay flow actually collects — the
 * deposit invoice charges 35%, progress/final invoices charge their full amount).
 * Balance is derived from invoices; we never bill past the contract total.
 */

export interface JobBalance {
  contractTotalCents: number;
  /** Collected so far = sum of charged amounts on PAID invoices. */
  collectedCents: number;
  /** Charged but not yet paid = sum on OPEN invoices. */
  openCents: number;
  /** Still owed = contract − collected (never negative). */
  remainingCents: number;
  /** Not yet invoiced = contract − collected − open (never negative). */
  unbilledCents: number;
}

const charged = (inv: Invoice) => inv.depositCents;

export function jobBalance(contractTotalCents: number, invoices: Invoice[]): JobBalance {
  let collected = 0;
  let open = 0;
  for (const inv of invoices) {
    if (inv.status === "void") continue;
    if (inv.status === "paid") collected += charged(inv);
    else if (inv.status === "open") open += charged(inv);
  }
  const remaining = Math.max(0, contractTotalCents - collected);
  const unbilled = Math.max(0, contractTotalCents - collected - open);
  return {
    contractTotalCents,
    collectedCents: collected,
    openCents: open,
    remainingCents: remaining,
    unbilledCents: unbilled,
  };
}

/** Clamp a requested progress/final charge to what is still un-invoiced. */
export function clampInvoiceCharge(requestedCents: number, balance: JobBalance): number {
  const req = Math.round(Number(requestedCents) || 0);
  return Math.max(0, Math.min(req, balance.unbilledCents));
}

export const PROGRESS_TYPES: InvoiceType[] = ["progress", "final"];

export function isProgressType(t: unknown): t is "progress" | "final" {
  return t === "progress" || t === "final";
}
