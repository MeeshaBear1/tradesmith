# Tradesmith — Functionality & Utility Audit

> Full-product audit (June 2026). Two file-grounded code audits (functionality + utility) cross-checked against runtime evidence. Scope: does it **work**, and is it **useful** to a real contractor. Not a security pass (see `SITE_AUDIT.md` for that).

## Verification basis
- **Runtime (this session):** the full money flow `login → job → measure → estimate → proposal → accept → invoice → financing` was live-probed end-to-end and verified — accepting good/better/best yields the correct server-derived invoice amount (PASS×3), accept is idempotent (re-accept can't switch tier), the render path no-ops cleanly with no keys, and `npm run build` is green (24 routes, TS clean). *(A re-probe during this audit was blocked by local dev-server/port instability — an environment issue, not a product defect.)*
- **Code:** every route, page, store, the 16 verticals, libs, and migrations were read directly. Findings cite `file:line`.

---

## Part 1 — FUNCTIONALITY (does it work)

**Bottom line:** the core loop genuinely works end-to-end in both demo and keyed modes, and all 16 verticals produce valid 3-tier estimates. Issues are at the edges — keyed-mode config gaps, dead/stubbed features, cosmetic empty states. Nothing in the demo path is broken.

### 🔴 BROKEN (fix before keyed production)
| # | Finding | File | Impact |
|---|---|---|---|
| F1 | `hasKey("supabase")` checks only URL + anon key, but the whole app uses the **service-role** key. Set URL+anon and forget `SUPABASE_SERVICE_ROLE_KEY` → `getStore()` picks `SupabaseStore`, every query runs with an empty key. | `src/config/env.ts:42` | App is **dead, not degraded** — every page/route 500s. (The render gate already checks the service key, so it's internally inconsistent.) One-line fix. |

### 🟠 INCOMPLETE (feature exists partway)
| # | Finding | File | Impact |
|---|---|---|---|
| F2 | Financing never persists — `createFinancingApplication` is defined in the interface, both stores, and the table, but **no route ever calls it**. The "Get pre-approved" button only flips local state. | `api/financing/quote/route.ts`, `PayPanel.tsx:251` | Illustrative-only; contractor never sees who applied. |
| F3 | `change_orders` table is **schema-only** — no route, page, type, or store method. | `0001_init.sql:126` | Dead schema; advertised-adjacent feature does nothing. |
| F4 | Roofing rate card is **not contractor-editable** — `/settings/rates` filters to form trades; `/api/rate-card` explicitly rejects roofing; roofing only gets the global regional factor. | `settings/rates/page.tsx:10`, `rate-card/route.ts:50` | Contradicts "Your rate card, your markup" for the flagship trade. |
| F5 | Progress/final invoices never created — `InvoiceType` has them but only `type:"deposit"` is ever minted. `getProposalById` is dead code. | `accept/route.ts`, `store.ts:69` | Can't bill past the 35% deposit (see U9). |

### 🟡 FRAGILE (works, but risky in keyed mode)
| # | Finding | File | Impact |
|---|---|---|---|
| F6 | AI roof measurement calls **deprecated Mapbox Geocoding v5** (retired in favor of v6). | `roofing/vision.ts:32` | In keyed mode geocode may fail → silently falls back to the demo stub, so the headline "AI traces the roof" quietly doesn't fire. Degrades without crashing. |
| F7 | Stripe client pins **no `apiVersion`**. | `stripe/client.ts:7` | SDK default can drift from types; low risk in test mode. |
| F8 | `seed.sql` sets job statuses (`estimated`/`paid`) but inserts no estimates/proposals/invoices; jobs use generated UUIDs with `on conflict do nothing`. | `seed.sql:16` | Fresh keyed DB shows "No estimate yet" under a "paid" badge (cosmetic); re-running seed duplicates demo jobs. |
| F9 | `estimate/route.ts:68` indexes `tiers[0]` unguarded. | — | Can't throw today (always 3 tiers); fragile if a future vertical yields fewer. |

### ⚪ DEMO-ONLY (working as designed)
- `/api/dev/login-as-demo` is the **only** sign-in — a keyless bypass to one shared demo tenant. Multi-tenancy/IDOR guards are correct, but in-memory mode is one global mutable dashboard for all visitors (`memory.ts` singleton).
- Render path is correctly gated (Gemini key + Supabase Storage + bucket) and degrades to the swatch board. **Renders roofing-only** — only roofing has a `satelliteImageUrl` source; form trades return `no_source_image` (`generate.ts:48`).
- Demo "mark paid" is correctly disabled when Stripe keys are present.
- **No automated tests exist in the repo** — none of this is regression-guarded.

### ✅ Verified working (don't worry about these)
Full demo loop end-to-end · keyed Stripe loop (server-verified confirm, idempotent webhook, server-derived deposit, client amounts never trusted) · idempotent accept (both stores) · estimate version-collision retry · rate-card override validation (shape/ceiling/sort/allow-list) · HMAC auth + prod secret guard + tenant ownership checks · graceful degradation everywhere (no Anthropic/Mapbox/Stripe/Supabase) · all 16 verticals → 3 ascending non-zero tiers · integer-cents money math · swatch-board render fallback.

---

## Part 2 — UTILITY (is it useful to a real contractor)

**Bottom line:** a polished, honest **demo of the workflow** — but **not yet usable for a real friends-and-family pilot**, for four hard reasons (P0s below).

### 🔴 P0 — blocks real daily use
| # | Gap | Why it matters | Evidence |
|---|---|---|---|
| U1 | **No edit/delete of anything.** The `Store` exposes only `updateJobStatus` + `updateContractorRateConfig` — no edit/delete job, estimate, proposal, or void invoice. Job detail is 100% read-only. | A fat-fingered address, an added chimney, or a price revision happens *daily* — the only recourse is to start a new job. The single biggest blocker. | `store.ts:49-86`, `jobs/[jobId]/page.tsx` |
| U2 | **No real signup.** Every CTA links to `login-as-demo`; everyone shares the seeded "Apex Roofing" tenant. No path to be yourself. | A pilot contractor can't create their own company. | `page.tsx`, `login-as-demo/route.ts`, `auth/session.ts` |
| U3 | **Can't set company profile/logo/brand.** Settings renders name/phone/license/logo/color **read-only**; `logoUrl` is never uploaded or rendered (proposal shows a first-letter monogram). | "White-labeled to your shop / your logo, your color" is **not actually deliverable** — proposals go out branded "Apex Roofing." Guts the core value prop. | `settings/page.tsx`, `p/[token]/page.tsx:54` |
| U4 | **Money & financing aren't real.** Financing is explicitly mocked (no lender); Stripe is test-mode with **no Connect/payout account** → funds wouldn't reach the contractor. | "Deposit in the bank before you pack up" isn't true for a real job. | `financing.ts:1`, `stripe/checkout/route.ts` |

### 🟠 P1 — needed within the first week
| # | Gap | Why it matters |
|---|---|---|
| U5 | **No customer/CRM** — homeowner is denormalized onto the job; no contacts, no history, no link between a homeowner's jobs. | Contractors live on repeat/referral; this is a one-shot quote generator, not a back-office. |
| U6 | **No search/filter/sort** on the jobs list (flat `listJobs`). | Fine at 3 jobs, unusable at 80 — jobs lost within a month of real use. |
| U7 | **Share = copy-link only.** No email-to-homeowner (despite capturing the email), **no PDF export** anywhere. | Re-roof buyers expect an emailed PDF to forward to a spouse/insurer. |
| U8 | **No resend/revise proposal.** Newest-by-date wins; no versioning UI; no counteroffer flow. | Revisions are daily reality in contracting. |
| U9 | **Change orders + progress/final invoices are schema-only.** Only the 35% deposit is ever billed. | The tool drops you after the deposit — can't bill the other 65% or any change (most of the job's money). |
| U10 | **No team/roles** — auth is one cookie = one contractor, but pricing sells "up to 10/25 users." | Marketing promises seats the product can't create. |

### 🟡 P2 — polish
- **U11** Estimate inputs are sane but coarse (e.g., remodel = area/rooms/scope); a real bid often needs a manual line-item tweak the app **can't make** (ties to U1). Roofing waste/pitch math is solid and offline-safe. Defaults are good enough to *start* a quote, not *send* one unedited.
- **U12** Without a Mapbox key the headline "AI traces the roof" silently becomes "type the numbers yourself."
- **U13** `/inbox` is only the public waitlist feed — no homeowner-view/accept/pay notifications (the `"viewed"` proposal status is never set).

### Verdict — readiness for a friends-and-family roofing pilot
The workflow **demos beautifully and the loop genuinely runs** — real, offline-safe estimate engine; editable form rate cards; carefully honest marketing (no fabricated proof). But a roofer **cannot run one real job through it as themselves** until: per-contractor accounts (U2) + an editable company profile with logo so proposals are actually white-labeled (U3), basic edit/delete on jobs & estimates (U1), live Stripe Connect payouts (U4), and at minimum emailed/PDF proposals (U7).

---

## Recommended remediation order
1. **F1** — service-key gate (one line; prevents a dead-on-arrival keyed deploy). *Quick.*
2. **U3 + U2** — editable company profile (name/phone/license/logo/color) + a minimal real signup, so a pilot contractor is *themselves* and proposals are truly white-labeled. *The unlock for a pilot.*
3. **U1** — edit/delete on jobs & estimates (+ resend proposal, U8). *Removes the daily dealbreaker.*
4. **U7** — email + PDF the proposal/invoice. *Table stakes for homeowner delivery.*
5. **U4** — Stripe Connect onboarding + payouts (real deposits). *Makes the money real.*
6. Then: customer/CRM (U5), jobs search/filter (U6), progress/final invoices + change orders (U9, F3/F5), team/roles (U10). Finance persistence (F2), Mapbox v6 (F6), and a test suite alongside.
