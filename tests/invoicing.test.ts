import { describe, it, expect } from "vitest";
import { jobBalance, clampInvoiceCharge } from "@/lib/invoicing";
import type { Invoice, InvoiceStatus, InvoiceType } from "@/lib/db/types";

function inv(over: Partial<Invoice>): Invoice {
  return {
    id: "i", jobId: "j", contractorId: "c", proposalId: "p", publicToken: "tok",
    amountCents: 0, depositCents: 0, type: "deposit" as InvoiceType, status: "open" as InvoiceStatus,
    stripePaymentIntentId: null, paidAt: null, createdAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("jobBalance — collected / open / remaining / unbilled", () => {
  const contract = 1_000_000; // $10,000

  it("a paid 35% deposit collects the charged amount, not the contract", () => {
    const b = jobBalance(contract, [inv({ type: "deposit", amountCents: contract, depositCents: 350_000, status: "paid" })]);
    expect(b.collectedCents).toBe(350_000);
    expect(b.remainingCents).toBe(650_000);
    expect(b.unbilledCents).toBe(650_000);
    expect(b.openCents).toBe(0);
  });

  it("an open progress invoice reduces unbilled but not remaining", () => {
    const b = jobBalance(contract, [
      inv({ type: "deposit", depositCents: 350_000, status: "paid" }),
      inv({ type: "progress", amountCents: 400_000, depositCents: 400_000, status: "open" }),
    ]);
    expect(b.collectedCents).toBe(350_000);
    expect(b.openCents).toBe(400_000);
    expect(b.remainingCents).toBe(650_000); // still owed until paid
    expect(b.unbilledCents).toBe(250_000); // 1,000,000 - 350,000 - 400,000
  });

  it("void invoices are ignored", () => {
    const b = jobBalance(contract, [inv({ depositCents: 350_000, status: "void" })]);
    expect(b.collectedCents).toBe(0);
    expect(b.unbilledCents).toBe(contract);
  });

  it("never goes negative when fully collected", () => {
    const b = jobBalance(contract, [
      inv({ depositCents: 350_000, status: "paid" }),
      inv({ type: "final", depositCents: 700_000, status: "paid" }),
    ]);
    expect(b.collectedCents).toBe(1_050_000);
    expect(b.remainingCents).toBe(0);
    expect(b.unbilledCents).toBe(0);
  });
});

describe("clampInvoiceCharge — never bill past the contract", () => {
  const contract = 1_000_000;
  const balance = jobBalance(contract, [inv({ depositCents: 350_000, status: "paid" })]); // unbilled 650,000

  it("clamps an over-ask to what's unbilled", () => {
    expect(clampInvoiceCharge(900_000, balance)).toBe(650_000);
  });
  it("passes a within-budget charge through", () => {
    expect(clampInvoiceCharge(200_000, balance)).toBe(200_000);
  });
  it("floors negatives/garbage to zero", () => {
    expect(clampInvoiceCharge(-5, balance)).toBe(0);
    expect(clampInvoiceCharge(NaN, balance)).toBe(0);
  });
});
