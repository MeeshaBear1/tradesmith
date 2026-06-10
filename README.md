# Tradesmith — the Trades Operating System

An AI back-office for small contractors. An **address (or a few measurements) goes in**; an **AI
takeoff, a tiered estimate, a branded proposal, an invoice, and a card payment come out**. Roofing is
the hero vertical (measured from satellite); **siding, gutters, windows, and remodels** run through the
same estimate → proposal → payment pipeline via a pluggable vertical framework.

The real prize isn't the seat — it's the rails underneath. Tradesmith sits between the contractor
and the homeowner's invoice, which is where **payments** (a take-rate on every job) and **lending**
(financing the homeowner's roof) live. This MVP demonstrates that wedge end-to-end.

## The loop

`Address → AI satellite takeoff → Good/Better/Best estimate → branded proposal (e-sign) → deposit invoice → Stripe payment + "finance this roof"`

## Run it

```bash
npm install
npm run dev        # http://localhost:3000  → "Enter the demo" (signs in as Apex Roofing)
```

**It runs with zero API keys.** Copy `.env.example` → `.env.local` and add keys to light up the real
capabilities:

| Key | Lights up | Without it |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Claude reads a satellite tile, traces the roof, writes proposal copy | Manual footprint/pitch entry; templated copy |
| `MAPBOX_TOKEN` | Geocode + satellite imagery | Manual entry (pricing still works) |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test) | Real test-mode deposit payment | "Mark as paid (demo)" button |
| `NEXT_PUBLIC_SUPABASE_URL` + keys | Postgres persistence | In-memory store (resets on restart) |

Stripe test card: `4242 4242 4242 4242`, any future date / CVC.

### Supabase (optional)
Apply `supabase/migrations/0001_init.sql` then `supabase/seed.sql` (the seed's fixed contractor UUID
matches the demo-login bypass).

## Architecture

- **`src/lib/takeoff/`** — the vertical-pluggable contract (`types.ts`, `registry.ts`) + the roofing
  engine (`roofing.ts`). Add a vertical = one registry entry.
- **`src/lib/roofing/`** — `vision.ts` (Mapbox + Claude `report_roof` tool), `geometry.ts` (shoelace
  area from the AI's normalized roof polygon → footprint; pitch/waste math), `estimate.ts` (material
  + labor takeoff → price).
- **`src/data/roofing-ratecard.json`** — every number (materials, labor, markup stack) lives here,
  contractor-editable.
- **`src/lib/pricing/markup.ts`** — the compounding markup stack (GC 8% / O&P 10% / contingency 5% /
  escalation 3% / bonds 2% ≈ 1.31×), mirrored from the Plansmith/Omniscient cost engine.
- **`src/lib/verticals/`** — the construction-trade framework. `types.ts` (declarative `VerticalConfig`
  with input fields + priced line items), `engine.ts` (generic Good/Better/Best estimator), `configs.ts`
  (siding, gutters, windows, remodel + roofing metadata), `registry.ts`. **Add a trade = add a config +
  one registry entry.** Roofing keeps its dedicated geometry engine; the estimate route dispatches by trade.
- **`src/lib/db/`** — a `Store` interface with two backends: in-memory (demo) and Supabase. Tenancy is a
  **HMAC-signed** contractor-id cookie (`src/lib/auth/session.ts`); RLS is enabled in the migration as
  defense-in-depth.
- **`src/app/`** — public marketing site + waitlist (`/`), dashboard + wizard + feedback inbox
  (auth-gated), `p/[token]` (public proposal), `pay/[token]` (public invoice), and the API routes.

**Design commitment:** every estimate is a **pure, offline function** of its inputs. Mapbox + Claude only
*pre-fill* the roofing inputs, so the back half of the loop always works.

## Construction trades (the expansion framework)

**16 trades live:** Roofing (AI satellite measurement) plus Siding, Gutters, Windows, Remodel (GC),
Electrical, HVAC, Plumbing, Solar, Painting, Concrete, Fencing, Decking, Insulation, Drywall, and Flooring
— all form-measured, all running the same estimate → proposal → invoice → payment pipeline.

A trade is a `VerticalConfig`: input `fields`, declarative `lines` (each a quantity function of the inputs),
an **editable `rates` table** (flat or Good/Better/Best unit costs in cents), and the shared compounding
markup stack. The generic `estimateVertical()` turns any config into Good/Better/Best `EstimateTier[]` — the
exact shape roofing produces. **Add a trade = one config object + one registry line.**

### Contractor-editable pricing
- **Rate card editor** (`/settings/rates`): every trade's unit costs are editable per Good/Better/Best,
  persisted to the contractor (`rateConfig`, stored in `contractors.default_rate_card`).
- **Regional factor:** a single per-contractor multiplier applied to every estimate (roofing included).
- Estimates read the contractor's overrides at pricing time; the seed numbers are realistic 2026 defaults
  for "initial perusal," meant to be tuned to the shop's suppliers and market.

## Honesty about the AI takeoff

This measures a roof from a **single top-down satellite tile** — an *AI assist to qualify and quote*,
not a sealed bid. Pitch can't be truly seen from nadir imagery, so it's always user-confirmable;
footprint is typically within ~10–15% on clean roofs, total price ~15–25%. Every measurement shows a
confidence band and an "AI assist — confirm on-site" disclaimer. This is **not** EagleView/Hover-grade
(those use stereo photogrammetry) — and the UI says so.

## What's real vs. mocked (this build)

- **Real:** the takeoff/estimate/proposal/invoice spine across all 5 trades; Claude vision + copy; Stripe
  **test-mode** payments with a server-verified confirm + idempotent webhook; a public marketing site with
  waitlist/feedback capture and a dashboard inbox.
- **Mocked (clearly labeled):** "Finance this job" (deterministic amortization, no lender/KYC); real
  Stripe Connect onboarding/payouts and contractor materials-float financing are out.

## Security posture (hardened)

A two-track security + correctness audit was run and the findings fixed:
- **Signed sessions** — the contractor cookie is HMAC-signed (`SESSION_SECRET`); a forged id is rejected.
- **Tenancy + IDOR** — every authed route checks ownership; the proposal route verifies the estimate
  belongs to the job *and* tenant.
- **Payments** — the demo "mark paid" endpoint is disabled when Stripe is configured; in Stripe mode,
  "paid" is authoritative only via a server-verified PaymentIntent (`/api/stripe/confirm`) or the signed
  webhook. Checkout reuses PaymentIntents and refuses non-`open` invoices.
- **Input validation** — all bodies are safe-parsed; client measurement overrides are clamped to sane
  ranges before pricing (no NaN/overflow estimates).
- **RLS** — enabled on every table (deny anon/authenticated; service-role for app access).

Remaining hardening for true multi-tenant production (documented, not yet done): full Supabase Auth,
token TTL/revocation, webhook refund/dispute reconciliation.

## Next

- **Deepen each trade:** the form-based trades use seed rate cards — make them contractor-editable, and
  add AI measurement to siding/GC by porting Omniscient's `intake/footprint_extractor.py`
  (blueprint → geometry), where the construction engine is a genuine unfair advantage.
- **Own the rails:** Stripe Connect + KYC + payouts (the 2–3%), then real lending partners.
- **Accuracy:** evaluate buy-vs-build on stereo aerial imagery once volume justifies.
- **Auth:** swap the signed-cookie session for full Supabase Auth before onboarding a second real tenant.
