# Audit Remediation — what was fixed vs. deferred

Companion to `docs/SITE_AUDIT.md`. The audit's must-fix block was applied immediately (verified: typecheck clean, production build green, smoke-tested). Judgment calls are flagged for you at the bottom.

## Fixed + verified

| Audit ID | Fix | File(s) |
|---|---|---|
| **C1 (Critical)** | Fail-closed at runtime in production if `SESSION_SECRET` is unset or equals the dev default (skips `next build` so it doesn't break deploys). | `src/config/env.ts` |
| **H2 (High)** | Added the missing `default_rate_card jsonb` column to the `contractors` table — rate-card save no longer 500s on real Supabase. | `supabase/migrations/0001_init.sql` |
| **H3 (High)** | Rate-card overrides now validated **against the seed**: shape-match (flat vs tiered), unknown `rateKey`s dropped (allow-list), tiered values sorted ascending so Good ≤ Better ≤ Best can't invert. Verified: a hostile `{good:90000,better:50000,best:10000}` is stored sorted; a flat value for a tiered seed is rejected; an unknown key is dropped. | `src/app/api/rate-card/route.ts` |
| **M1 (Med→High)** | Per-rate ceiling clamp (≤ $50,000/unit) prevents `int4 total_cents` overflow / charge corruption on the form path (mirrors the roofing sanitizer). | `src/app/api/rate-card/route.ts` |
| **M2 (Med)** | Key allow-list + shape-match also caps stored-JSONB bloat (only known keys persist). | `src/app/api/rate-card/route.ts` |
| **M3 (Med)** | `roofing` overrides now explicitly rejected by the rate-card POST (roofing is geometry-priced; the override was dead data). | `src/app/api/rate-card/route.ts` |
| **N3 (Low)** | Store write wrapped in try/catch → generic `save_failed`, never leaks raw Postgres detail. | `src/app/api/rate-card/route.ts` |
| **M1-fw (Med)** | Added a `feeCents` bucket so permits/design/fees stop being mislabeled as "disposal" in the breakdown (`baseCents` unchanged; totals identical). | `src/lib/takeoff/types.ts`, `src/lib/verticals/engine.ts`, `src/lib/roofing/estimate.ts` |
| **L2 (Low)** | `selectedTier` allow-listed against `["good","better","best"]` before storing → stored tier can't desync from the charged amount. | `src/app/api/estimate/route.ts` |
| **L3 (Low)** | Guarded the `tiers[1]` index fallback (`?? tiers[0]`). | `src/app/api/estimate/route.ts` |
| **D2 (Low)** | `confidence ?? 0` in the Supabase `toTakeoff` mapper (type-soundness with the nullable SQL column). | `src/lib/db/supabase-store.ts` |
| **Framework Low** | Gutters now has a "Remove old gutters?" field and only bills tear-off when set (new-construction no longer over-billed). | `src/lib/verticals/configs.ts` |
| **Pricing P14 (drywall)** | Removed the ceiling double-count (the input already includes ceiling area). | `src/lib/verticals/configs.ts` |

### Pricing realignment (seed defaults → market)
Better-tier $/unit, before → after (these are seed defaults; contractors tune them in `/settings/rates`):

| Trade | Before | After | Market |
|---|---|---|---|
| Solar | $3.60/W | **$3.08/W** | $2.50–3.50/W ✅ |
| Insulation | $3.54/ft² | **$2.47/ft²** | $0.60–2.30 (now near top) |
| Concrete | $11.34/ft² | **$9.11/ft²** | $4–8 broom (now high-normal w/ markup) |
| Siding | $16.33/ft² | **$15.32/ft²** | $5–15 (now top-of-band, defensible for fiber-cement Better) |
| Windows | $1,035/win | **~$900/win** | $450–850 |
| Decking | $57.92/ft² | **~$53/ft²** | $30–62 composite |
| Flooring | $16.30/ft² | **~$15.3/ft²** | $9–20 engineered |

> Honest note: siding and concrete still sit at the **high end** of market after the cut (the audit's lower projections were optimistic given the fixed 31% markup stack). They're defensible for a premium "Better" tier and fully editable — left there deliberately rather than under-pricing the seed.

## Deferred — needs your decision (not auto-fixed)

| Audit ID | Why deferred / the decision |
|---|---|
| **H1 + C3 (High) — feedback inbox not tenant-scoped** | This is a genuine product decision and it interacts with your "one dashboard for now" + public-demo setup. Today anyone who clicks **"Try the demo"** becomes the shared demo tenant and can see the `/inbox` with **real waitlist leads (names/emails)**. Options: **(a)** gate `/inbox` behind an operator secret (`OPERATOR_KEY` env) so demo visitors can't see leads — ~30 min, recommended for the feedback round; **(b)** add `contractor_id` to feedback + per-tenant scoping (only matters once you have multiple real tenants); **(c)** accept it for the friends-and-family round. Tell me which and I'll wire it. |
| **N2 (Low) — public feedback endpoint unthrottled** | Add a rate limit / Cloudflare Turnstile before broad public exposure. Cheap; deferred until you decide on H1. |
| **D1, D4, D6, D7, L1, L4 (Low)** | Dead `change_orders` schema, memory/Supabase version-race parity, store-cache restart note, `regionalFactor` string coercion, AI-dispatch keyed on string literal. None affect correctness or money today; batch them into a cleanup pass when convenient. |

## Verified clean (re-confirmed, no change needed)
Session HMAC (length-check + `timingSafeEqual`), service-role key server-only, all public token endpoints (server-derived amounts, idempotent accept, webhook dedupe), RLS `deny_all` on all tables, estimate/job IDOR guards, demo seed present, **16/16 tier-monotonic, crash-safe engine**.

**Net:** the must-fix-before-real-contractors block (C1, H2, H3) and the must-fix-before-real-money items (M1, fee label, pricing) are closed and verified. The one remaining real exposure for your feedback round is the inbox/demo-tenant overlap (H1) — a 30-minute fix once you pick option (a)/(b)/(c).
