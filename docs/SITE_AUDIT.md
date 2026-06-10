# Tradesmith — Site Audit (Security · Construction Framework · Pricing Realism)

> Produced by an 8-agent workflow (4 dimension reviews → adversarial verification → lead-auditor synthesis), grounded against the actual working tree. Read-only review; **fixes applied separately and noted in `docs/AUDIT_REMEDIATION.md`.**

**Date:** 2026-06-05 · **Scope:** working tree at `c:\Users\nileh\Code\tradesmith` including the new rate-card + 16-trade surface.

---

## 1. Executive Summary & Risk Posture

Tradesmith is a well-architected "Trades OS" — clean `Store` interface with dual backends, a declarative 16-trade framework, HMAC-signed sessions, token-gated public endpoints, RLS defense-in-depth, and a roofing AI/geometry engine that is best-in-class on pricing realism. The prior audit's fixes hold under re-review (HMAC length-check + `timingSafeEqual`, service-role server-only, token-keyed amounts, idempotent accept, webhook dedupe).

**The app is not yet safe to onboard real contractors or handle real money.** Three blockers, in order:

1. **Universal cookie-forgery vector (CRITICAL).** `env.ts` falls back to a committed dev secret with no production boot guard. If `SESSION_SECRET` is unset in prod, *any* tenant can be impersonated by forging a cookie for a known UUID. Silent misconfig → full tenant takeover. Must fail-fast.
2. **A shipped feature is dead on real Supabase (HIGH).** The rate-card save writes a `default_rate_card` column that **does not exist** in the migration → guaranteed 500. Passed smoke tests only because the in-memory demo store has no schema.
3. **Cross-tenant PII exposure once a second tenant exists (HIGH).** The feedback inbox is structurally un-scopeable (no `contractor_id`) and shown to every signed-in contractor — and since the public "Try the demo" shares that tenant, demo visitors can see real waitlist leads.

**Money posture:** Stripe/token plumbing is sound (server-derived amounts, idempotent, deduped, mark-paid gated to demo). The indirect risk: an unbounded rate magnitude can overflow `int4 total_cents` and corrupt the charged deposit; and four trades are materially over-market (solar, insulation, concrete, siding).

| Posture question | Verdict |
|---|---|
| Safe to onboard real contractors today? | **No** — fix C1, H1, H2, H3 first. |
| Safe to handle real money today? | **No** — also needs M1 (rate/total clamp). Core charge plumbing otherwise sound. |
| Is the construction math trustworthy? | **Yes for defaults** (16/16 tier-monotonic, crash-safe). **No for overrides** (zero validation). |
| Is pricing market-credible? | **Mostly** — 8 trades dead-on; 4 materially over-market need cuts. |

---

## 2. Security Findings (Critical → Low)

**C1 — CRITICAL — Hardcoded session-secret fallback, no prod boot guard → universal cookie forgery.** `src/config/env.ts:20` (`SESSION_SECRET ?? "tradesmith-dev-secret-change-me"`), consumed at `session.ts:17-20`. If unset in prod, an attacker computes the HMAC for the well-known demo UUID (or any leaked tenant UUID) offline and authenticates as that tenant. **Fix:** throw at module load when `NODE_ENV==="production"` and secret is missing or equals the dev default.

**H1 — HIGH — Feedback inbox not tenant-scoped → cross-tenant PII.** `store.ts listFeedback()` (no `contractorId`) → `supabase-store.ts` unfiltered `select("*")` → shown to every signed-in contractor at `inbox/page.tsx`. The `feedback` table has no `contractor_id`. With the public demo sharing the tenant, **demo visitors can see real waitlist leads**. **Fix:** operator-gate `/inbox` (or add `contractor_id` + filter).

**H2 — HIGH — `default_rate_card` column missing → rate-card save 500s on real Supabase.** `supabase-store.ts:39` reads it; `:151-159` writes it; the `contractors` table in `0001_init.sql` has no such column; grep across `*.sql` = zero. On Supabase → PostgREST 42703 → unhandled 500; rate card never persists. **Fix:** `alter table contractors add column if not exists default_rate_card jsonb;`

**H3 — HIGH — Rate overrides bypass ALL monotonicity & shape validation.** `rate-card/route.ts cleanRateValue` only checks finite/≥0 — no `good≤better≤best`, no flat-vs-tiered shape match against seed, no `rateKey` allow-list. Reachable inversions (`siding.siding={good:90000,...,best:10000}` → Good>Best), zero-Good, and shape-swaps persist and corrupt every future estimate for that trade. **Fix:** look up `getVertical(v).rates[rateKey]` — require shape match, drop unknown keys, sort tiers ascending.

**C3 — HIGH (was Critical) — `/api/dev/login-as-demo` ungated GET login in prod.** Intentional product behavior (public demo), so not a tenant-isolation breach by itself; its harm is downstream via H1. **Fix:** rename off the `/dev/` segment and/or keep but resolve H1 so the shared demo holds no real leads.

**M1 — MEDIUM(→High) — `cleanRateValue` has no ceiling → int overflow / charge corruption.** No upper bound + estimator doesn't re-clamp magnitude → a huge rate × max qty overflows `int4 total_cents` (insert 500) and feeds `invoice.depositCents`. Roofing path clamps (`sanitize.ts`); the form path doesn't. **Fix:** clamp each rate (≤ ~5,000,000¢/unit) and final `totalCents`.

**M2 — MEDIUM — rate-card payload unbounded key count/size → JSONB bloat** reloaded on every estimate. **Fix:** whitelist-intersect keys, cap counts + content-length.

**M3 — MEDIUM — roofing rate overrides silently ignored.** Estimate route never consults `rateConfig.rates.roofing`, but the POST accepts/stores it (dead data). **Fix:** reject `roofing` in the rate-card POST or document.

**N1 — LOW — dev login/logout are GET (CSRF/session-fixation).** Fold into C3: `POST` + gate.
**N2 — LOW — feedback endpoint unauthenticated + unthrottled → spam.** Add rate limit / Turnstile.
**N3 — LOW — store error bodies not scrubbed** (raw Postgres detail leaks in 500s). Wrap store writes in try/catch.
**L1** `regionalFactor` finite-check on raw string falls back to 1 (cosmetic). **L2** `selectedTier` unvalidated → stored tier can desync from charged amount (allow-list it). **L3** `tiers[1]` unguarded index (safe today).

**Verified clean (no action):** session HMAC, service-role server-only, all public token endpoints (server-derived amounts, idempotent accept, webhook dedupe), RLS deny_all on all 10 tables, estimate/job IDOR guards, demo seed exists, feedback NOT-NULL safety.

---

## 3. Construction-Framework Correctness & 16-Trade Tier-Monotonicity

The framework is **correct, monotonic, and crash-safe out of the box**; all defects are in the *override* path or are cosmetic.

**Tier-monotonicity — 16/16 PASS.** Proof: total-monotonicity ⇔ per-seed-rate-monotonicity because markup/regional are uniform positive multipliers and **no `qty` reads `tier`** (only `label` functions do); `remodel.scopeMult` is tier-independent and cancels.

**Crash/zero/negative safety — clean:** `qty=round(max(0,…))`, drops `qty≤0`, `unitCost=max(0,…)`, `sanitizeInputs` clamps + allow-lists, divide-by-zero guarded (`displayQty=max(1,…)`, roofing `billedSquares=max(0.5,…)`).

**Non-crashing correctness defects:**
- **M1-fw (Medium)** — `fee` lines misclassified into `disposalCents` (`engine.ts:64`). Total is correct; the per-tier breakdown mislabels permit/design/equipment fees as "disposal" (e.g. solar battery ~$16k under "disposal"). **Fix:** add a `feeCents` bucket.
- **Low** — gutters bills tear-off unconditionally (no `removeExisting` gate, unlike siding) → new-construction gutters billed removal.
- **Low (L4)** — `getVertical` falls back to roofing on unknown key; AI dispatch keys on the string `"roofing"` not `measurementMode==="ai"` → a 2nd AI trade needs a route edit.

---

## 4. Data-Layer / Extensibility Findings

| ID | Finding | Sev |
|---|---|---|
| H2 | `default_rate_card` column missing → Supabase write 500s | **HIGH** |
| D1 | `change_orders` is dead schema (defined+RLS'd, no type/Store/refs) | LOW |
| D2 | `takeoffs.confidence` nullable in SQL but non-null in TS; `toTakeoff` copies uncoerced | LOW |
| D3 | Supabase `setSelectedTier` 0-row no-op vs memory guard (can't corrupt) | LOW |
| D4 | Estimate-version: Supabase count+retry (unique-backed) vs memory length+1 (can dup under concurrency) | LOW |
| D5 | Double `sanitizeInputs` (idempotent today) | nit |
| D6 | memory `updateContractorRateConfig` returns live mutated object vs Supabase fresh row | LOW |
| D7 | `getStore()` caches backend for process life (demo→Supabase needs restart) | ops |

**Positives:** clean Store abstraction, token reads omit `contractor_id`, RLS well-formed, `Record<Vertical, VerticalConfig>` keeps the union exhaustive at compile time.

---

## 5. Pricing-Realism Table & Recommended Rate Adjustments

Computed through `estimateVertical()`/`estimateRoofing()` on each trade's **Better tier, default inputs**; markup ×1.3105; `regionalFactor=1.0`.

| # | Trade | Our Better total | Our $/unit | Market (2025–26 installed) | Verdict | Recommended seed change |
|---|---|---|---|---|---|---|
| 1 | Roofing | $14,414 | $554/sq | $400–600/sq | ✅ OK | none |
| 2 | **Siding** | $29,387 | **$16.33/ft²** | $5–15/ft² | 🔴 HIGH | `install` 450→380; `trim` 4500→3000 |
| 3 | Gutters | $2,801 | $17.50/lf | $6–20/lf | ✅ OK | none |
| 4 | Windows | $10,353 | $1,035/win | $450–850 | 🟡 hot | `install` 18000→14000 |
| 5 | Remodel | $76,796 | $384/ft² | $150–250/ft² | 🟢 denom artifact | none (fixed costs on 200 ft²) |
| 6 | Electrical | $4,076 | $204/device | $133–350 | ✅ OK | none |
| 7 | HVAC | $10,288 | $3,429/ton | $5–11k change-out | ✅ OK | none |
| 8 | Plumbing | $3,787 | $473/fixture | $300–800 | ✅ OK | none |
| 9 | **Solar** | $25,201 | **$3.60/W** | $2.50–3.50/W | 🔴 HIGH | `panels_inverter` better 180000→150000; `install` 45000→35000 |
| 10 | Painting | $8,060 | $3.22/ft² | $2–6/ft² | ✅ OK | none |
| 11 | **Concrete** | $6,802 | **$11.34/ft²** | $4–8/ft² broom | 🔴 HIGH | `concrete_material` 450→350; `forming_labor` 250→180 |
| 12 | Fencing | $8,171 | $54.47/lf | $30–60/lf | 🟢 gate artifact | none (ex-gates ≈$46/lf) |
| 13 | Decking | $17,377 | $57.92/ft² | $30–62/ft² | 🟡 top-of-band | `framing_labor` 700→550 (optional) |
| 14 | **Insulation** | $4,246 | **$3.54/ft²** | $0.60–2.30/ft² | 🔴 HIGH ~2× | `material` 140→90; `labor` 90→65; `airsealing` → flat fee |
| 15 | Drywall | $5,423 | $3.62/ft² | $1.50–3.50/ft² | 🟡 over | `ceilings` double-counts ceiling area |
| 16 | Flooring | $13,042 | $16.30/ft² | $9–20/ft² | ✅ OK | `install` 400→350 (optional) |

**Fix first:** Solar, Insulation, Concrete, Siding. **Hot but defensible:** Windows, Decking, Flooring, Drywall. **Not real issues:** Fencing (gate-bundling artifact), Remodel (fixed-cost denominator), the 8 well-calibrated trades. (Solar sensitivity elevated by the 2026 loss of the 30% federal ITC.)

---

## 6. Prioritized Remediation Roadmap

**MUST-FIX before onboarding real contractors:** C1 (env fail-fast) · H2 (add column) · H1+C3+N1 (scope/gate inbox + dev routes) · H3 (validate overrides) · trivials D2/L2.

**MUST-FIX before handling real money:** M1 (clamp rate ceiling + total) · M1-fw (fee breakdown label) · Pricing P1–P4 (solar/insulation/concrete/siding) · M2/N2/N3 (key whitelist + payload cap + rate-limit + scrub errors).

**POLISH:** M3 · pricing trims P5–P8 · D1/D3–D7/L1/L3/L4 · gutters tear-off gate.

**Net:** the blocking surface is small and concrete — one critical config guard (C1), one missing column (H2), one un-scopeable inbox (H1), one unvalidated override path (H3). Close those (plus D2/L2 + the M1 clamp) and it's safe for contractors; add the pricing realignment + breakdown label and it's safe for money. Invest validation effort in the *override* path, not the seeds.
