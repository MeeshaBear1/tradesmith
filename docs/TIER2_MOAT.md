# Tradesmith — Tier 2: The Moat & The Money

Tier 0 made it safe; Tier 1 made it sticky. Tier 2 makes it **defensible and
monetizable**. Each item here needs an external account or partner, so the codebase
ships the **seam** (the swap point) and this doc is the owner runbook. Strategic note
from the competitive work: the wedge is **not** "we have payments" (net <1%) — it's
**16-trade breadth + engine accuracy + contractor financing**.

---

## 1. Stripe Connect take-rate (own the rails)

**Built (scaffold):** `src/lib/stripe/connect.ts` — `createConnectOnboarding()` creates a
Connect **Express** account for a contractor and returns a hosted onboarding link.
Key-gated, fail-soft, additive (does not touch today's deposit charge).

**Remaining (owner + ~1 build):**
1. Enable **Connect** on the platform Stripe account (Dashboard → Connect → Get started).
2. Persist the connected `accountId` on the contractor (add `stripe_account_id` column +
   a `/api/connect/onboard` route that calls the scaffold and saves it).
3. Route charges to the contractor: on `paymentIntents.create`, add
   `on_behalf_of: accountId` + `transfer_data.destination: accountId` and an
   `application_fee_amount` (your take). That single change moves money to the contractor
   and skims the platform fee — the whole thesis, in one diff.
4. Gate the pay flow on "contractor finished onboarding" (account `charges_enabled`).

---

## 2. Real financing partner (the only fat margin)

**Built (seam + tested):** `src/lib/financing.ts` now exposes a `LenderProvider` interface
with a `MockLender` (illustrative, no capital risk) behind `getLender()`. Every call site
(quote teaser, apply flow) goes through it.

**Remaining (owner + ~1 build):**
1. Sign a partner (Wisetack / Sunlight / Hearth-style).
2. Implement `LenderProvider` against their API (`quote`, `prequalify`, plus a real
   `apply` returning a redirect/decision), gate it on its key, and return it from
   `getLender()`. Nothing else changes.
3. Persist real applications (the `createFinancingApplication` store method + table already
   exist — currently never called; wire it in the apply route).
4. Record your referral/origination economics. This is where real margin lives.

---

## 3. QuickBooks sync (promised on the $99 tier)

**Seam (documented):** the money objects are already clean and integer-cents
(`Invoice`, `Payment`, contractor profile), so an export adapter is a leaf addition.

**Remaining (owner + ~1 build):**
1. Create an Intuit developer app; implement OAuth2 (authorize + token refresh), store the
   realm id + tokens on the contractor (new columns).
2. Add `src/lib/integrations/quickbooks.ts` mapping a paid `Invoice` → a QBO `Invoice`/
   `SalesReceipt`, and push on the `payment_intent.succeeded` webhook (next to the receipt
   email — same hook).
3. Surface a "Connect QuickBooks" button in Settings. Keep it fail-open (a sync outage must
   never block a payment).

---

## 4. Deeper AI measurement (the accuracy edge vs Roofr)

**Partial down-payment already shipped:** the photo-to-scope feature
(`src/lib/scope/*`) extends AI measurement **beyond roofing to interior remodels** —
ground-photo → inferred scope → priced, editable line items. That's the first step of
"deepen measurement past the roof."

**Remaining:**
1. Bring the Omniscient **blueprint/footprint extractor** into the siding/GC path (plans
   or elevations → quantities) — the genuine accuracy moat.
2. Calibrate the scope catalog against real bid data per region; let contractors save their
   own scope templates (the catalog becomes per-contractor).
3. Multi-photo room dimensioning (reference-object or LiDAR on capable phones) to replace
   the typed floor area.

---

### Build order
Connect payouts (1) and the financing partner (2) are the revenue unlocks — do them first
with a design-partner contractor. QuickBooks (3) removes the biggest "real shop" objection.
Deeper measurement (4) is the durable moat and is already underway via photo-scope.
