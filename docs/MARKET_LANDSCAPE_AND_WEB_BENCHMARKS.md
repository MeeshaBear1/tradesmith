# Tradesmith — Market Landscape, Differentiation & Web Benchmarks (June 2026 refresh)

> Companion to `docs/COMPETITIVE_ANALYSIS.md` (which still governs the pricing/fintech math). This doc refreshes the competitor set with current sources, adds the entrants the first pass missed, sharpens **how we differentiate on quality**, and answers a new question: **which websites in this industry are worth benchmarking on quality and performance.** Source tags: `[web]` current-source-confirmed; `[est]` triangulated.

---

## 0. What changed since the last analysis

1. **Roofr re-priced (March 2026).** Legacy plan names retired. Now **Starter (free, $19/report, estimated delivery)**, **Essentials ($13/report, guaranteed delivery + full CRM)**, **Scale ($13/report + workflow automation)** — still the only no-monthly-cost option, still **no per-seat**. `[web]` The freemium + per-report model hardened, not softened.
2. **A new, more-existential competitor than Roofr: Handoff AI.** Multi-trade *residential* AI that turns a short description / photos / voice into an estimate → proposal → invoice → payment — i.e., **Tradesmith's exact thesis, but not roofing-locked.** $149/mo; **$5.8M strategic round from Nemetschek (owner of Bluebeam), June 2025**; part of 1build (**$25M+** total, YC/Greycroft/Masco Ventures); ~10k MAU, **$6B annualized project volume**. `[web]` Roofr is the roofing threat; **Handoff is the *multi-trade* threat — and the one with a blueprint pipeline (Bluebeam) aimed at the exact GC moat we're counting on.**
3. **AI takeoff is now a crowded, funded category.** Togal.AI (up to 98% accuracy), Beam AI, **Kreo ($35/mo "Caddie AI")**, STACK, CountBricks. These are *commercial/blueprint* estimators (different ICP — pro estimators at firms), but they validate (a) the market (construction estimating SW **$1.06B → $1.51B by 2035** `[web]`) and (b) that AI-from-drawings is no longer novel.
4. **Financing got more competitive AND more bankable.** Acorn Finance (free to contractor, **30+ lender marketplace, loans to $100k / 20yr**); **LendingClub began originating home-improvement loans through Wisetack (April 2026)** — a bank balance sheet at the point of sale; Wisetack now embedded with **~40,000 contractors (~4% fee)**. `[web]`
5. **The vertical-SaaS-fintech thesis is now data-proven.** Stripe/Tidemark 2025 (200+ vertical SaaS cos): **median payments attach rate doubled in a year; 87% of fintech-offering companies also offer payments; ~⅓ made payments mandatory → higher NRR; Toast & Shopify now earn the *majority* of revenue from embedded payments/lending/banking.** `[web]` This confirms our "payments mandatory to transact; fintech attach is survival" stance.

---

## 1. Who is attempting to do what we're doing

We sit at the intersection of four categories. Almost nobody occupies all four; that intersection is the opening.

| # | Category | Leaders | Doing *our exact thing*? |
|---|---|---|---|
| 1 | **All-in-one Field-Service OS** (SMB) | Jobber, Housecall Pro | Partially — back-office + payments, **no AI takeoff/estimate intelligence** |
| 2 | **Roofing vertical platform** | **Roofr**, JobNimbus, AccuLynx, Leap | **Yes, in roofing only** — Roofr is the roofing twin |
| 3 | **AI estimate → back-office** (multi-trade) | **Handoff AI**, (early others) | **Yes — closest to our multi-trade thesis** |
| 4 | **AI takeoff / measurement** | EagleView, Hover, Togal, Beam, Kreo, GAF, RoofSnap | Input commodity — don't compete here |
| + | **Embedded fintech rails** | Stripe, Wisetack, Acorn, Hearth, GreenSky, Service Finance | The monetization layer everyone is racing into |

### The competitor set that matters (refreshed)

| Competitor | Who they serve | Pricing | Take / fintech | Threat to us |
|---|---|---|---|---|
| **Handoff AI** ⚠️ NEW | **Multi-trade residential** (remodel/handyman/GC) | $149/mo | AI estimate→proposal→invoice→**payments**; Bluebeam/Nemetschek backing | **HIGHEST on our *multi-trade* thesis** — same loop, not roofing-locked, with a blueprint pipeline |
| **Roofr** ⚠️ | Solo→SMB roofers (our exact ICP) | $0 + $13–19/report; no per-seat | 2.8%+30¢ card / 0.5% ACH; GoodLeap financing | **HIGHEST in roofing** — funded, freemium, shipped |
| **JobNimbus** | Small→large roofers | $25–$110/user/mo | JobNimbus Payments + in-app financing; owns SumoQuote; ABC-Supply/QXO capital | HIGH — most complete roofing bundle |
| **AccuLynx** | Mid→enterprise roofers | $99–$299/mo (≈$170+/user) | Integrated pay; RoofScope | Med — up-market |
| **ServiceTitan** | Mid→enterprise (all trades) | $245–$500+/tech/mo; $5k–$50k impl; **Yr-1 $50–70k+ for 10 techs** | Custom interchange-plus; Service Finance/Synchrony/Affirm | Low for us — **ignores the long tail; our positioning foil** |
| **Housecall Pro** | 1–20 techs (all trades) | $59 → ~$329/mo | 2.59% swiped / 2.99% online / 1% ACH; Wisetack | HIGH — same buyer + same fintech playbook |
| **Jobber** | 1–15 techs (all trades) | $39 → $249/mo (to 15 users) | 2.9%+30¢ online; Wisetack | HIGH — owns the horizontal SMB slot |
| **Hover** | Solo→enterprise exterior | $29 one-time → ~$99/mo | 3D visualization; **300k+ contractors**; partner financing | HIGH on **visual sales** (the bar for renders) |
| **CompanyCam** | All trades (field) | per-user | Photo/field documentation; not estimating | Low direct — but the **field-authenticity bar** |
| **EagleView / Togal / Beam / Kreo** | Insurance / pro estimators | $13–87/report; $35–300/user/mo | Measurement/takeoff only | Low direct — commodity input + future GC-moat references |
| **Wisetack / Acorn / Hearth / GreenSky** | Financing rails | — | 3.9–9.9% / free-marketplace / subscription-no-dealer-fee / dealer fee to ~26% | The lane we must eventually *own*, not resell |

⚠️ **Two competitors to benchmark on every axis: Roofr (roofing) and Handoff (multi-trade).** If the first analysis had one north-star comp, this one has two — and Handoff is the more strategically dangerous because it shares our *breadth* ambition and has Bluebeam's blueprint rails.

---

## 2. How we differentiate — and offer a *higher-quality* product

Three of our original four "moats" are commoditized (measurement, payments) or unbuilt (owned lending). Honest differentiation rests on **four real edges**, in priority:

**A. Multi-trade breadth on one engine — without going inch-deep.**
Roofr is roofing-only; Jobber/HCP have no estimate intelligence; Handoff is the real multi-trade rival. Our 16-trade declarative engine lets a shop quote roofing *and* siding, gutters, windows, and remodel on one screen with one rate card. **Quality bar:** go deep on 2–3 anchor trades (roofing + exterior) with the engine as the depth multiplier before claiming all 16 — "mile-wide/inch-deep" is the failure mode.

**B. Code-grounded estimate accuracy (the Plansmith/Omniscient moat).**
Competitors price off flat templates or a blank form. Our estimates inherit a real building-code/assembly markup stack (GC/O&P/contingency/escalation/bonds ≈ 1.31×) and trade-specific takeoff logic. **The customer-facing promise is "accurate estimates, fewer callback re-bids," not "we know code"** — accuracy is the felt benefit. This is the one edge incumbents can't bolt on in a quarter, and it deepens toward a genuine moat in the **GC/blueprint vertical** (where Handoff+Bluebeam are also headed — so move deliberately).

**C. The proposal as an *experience*, not a PDF — quality as a trust proxy.**
A 5-figure re-roof is an emotional, trust-gated purchase. We win the homeowner with: **their own house rendered "after"** (Tier-1 swatch board now, AI img2img behind a key gate later), **interactive Good/Better/Best** the homeowner self-upsells through, a **trust band** (licensed/insured/warranty/reviews), **financing "from $X/mo"** at the price reveal, and a **white-labeled, premium** page that makes a one-truck shop look like the biggest name in town. Most competitors stop at a clean PDF. *This is where design quality directly converts.*

**D. The new brand: "Cold Steel & Forge Fire" — looking like the licensed pro in the clean truck.**
Per `BRAND.md`: archetype **The Craftsman**, tension **Built tough × Quietly smart**, tagline **"Forged for the field."** Forged-graphite + disciplined forge-orange + Archivo "stamped" type + a blueprint-grid texture — deliberately *not* the generic-SaaS gradient look, *not* emoji-startup, *not* condescending Silicon Valley. In a category where most contractor tools read either "enterprise-cold" or "weekend-project," a brand that respects the trade is a differentiator homeowners and contractors both feel.

**Plus the structural bet (not yet built, phase it honestly):** **contractor materials-float lending** — working capital against the supply purchase, tied to supplier-embedded distribution. No SMB incumbent occupies this lane; it's the one fat, unowned pool. Never represent it as shipped before it is.

**One-sentence position:**
> *The back-office-first Trades OS for the 16-trade SMB long-tail that ServiceTitan ignores — grounded in real building-code knowledge for accurate estimates, with a proposal homeowners actually say yes to, and payments + contractor-side financing built in.*

---

## 3. The best websites in this industry — quality + performance benchmarks

Two tiers: **direct-industry exemplars** (study the category) and **cross-industry gold standards** (aim *above* the category — this is how we out-class Roofr/Handoff on first impression).

### Tier 1 — Direct industry (study these)
| Site | Why it's worth studying | Steal this |
|---|---|---|
| **getjobber.com** | The SMB-trades conversion benchmark: plain-spoken, proof-driven, transparent published pricing, CTAs "where decisions happen." `[web]` | Pricing transparency as a wedge; trade-specific landing pages; outcome-led copy |
| **servicetitan.com** | Enterprise polish; rebuilt on **Gatsby + Contentful** headless to fix slow load + brand drift; deep, navigable resource/content hub. `[web]` | Content hub for SEO authority; consistent design system; speed as a KPI |
| **roofr.com** | Product-led, freemium-forward; the instant-estimator demo *is* the hero. | Lead with the live product moment; "$0 to start" prominence |
| **handoff.ai** | Demo-forward AI: "type a description → get an estimate" shown immediately. | Make the AI magic *visible* on the page, not described |
| **hover.to** | 3D visualization as the emotional proof; "trusted by 300k+ contractors." | Visual "after" proof; big trust numbers |
| **companycam.com** | Field-authentic — real jobsite photos, real crews, no stock-smile gloss. | Documentary photography (matches our art direction exactly) |

### Tier 2 — Cross-industry gold standard (aim here to beat the category)
| Site | Why it's the bar | Most relevant to us |
|---|---|---|
| **Toast (pos.toasttab.com)** | **Our closest strategic analog** — vertical SaaS that became an embedded-payments/lending company; the marketing makes "the all-in-one for *your* trade" feel inevitable. | The exact playbook we're running, one industry over |
| **Stripe (stripe.com)** | The canonical bar: clarity, fast load, real product visualization, typographic discipline. `[web]` | Fintech credibility through restraint |
| **Linear (linear.app)** | Product-led storytelling, motion used with discipline, dark precision. `[web]` | Motion only where it earns it (our 3 motion rules) |
| **Ramp (ramp.com)** | **Bento-grid** discipline formalized into a design language; dense value, still calm. `[web]` | Feature density without clutter — our dashboard challenge |
| **Mercury (mercury.com)** | Premium fintech trust + warmth; how to look substantial without going cold. | The "trust + warmth" balance our brand targets |

### Performance benchmarks (the "performance" half of the ask)
The category's biggest, slowest sites (ServiceTitan pre-rebuild) prove the cost of ignoring this; the gold-standard sites all load fast. Targets and why they matter:

| Core Web Vital | "Good" threshold | Why it matters |
|---|---|---|
| **LCP** (load) | **< 2.5s** | Rakuten A/B: good LCP → **+33% conversion, +53% revenue/visitor**. `[web]` |
| **INP** (interactivity) | **< 200ms** | Replaced FID in 2024; punishes heavy JS hydration |
| **CLS** (visual stability) | **< 0.1** | Layout shift on a pricing/Accept button kills trust |

- **General rule:** every **0.1s** of speed ≈ **+8% conversions**. `[web]`
- **Measure with:** PageSpeed Insights (field/CrUX), Lighthouse (lab), WebPageTest (waterfall), RUM. Note: a perfect Lighthouse lab score can still fail real-world CWV — trust **field** data. `[web]`
- **Our position:** Next.js 16 + Turbopack is well-suited to hit these. **Watch list for our own site:** we just added 3 font families (Archivo / Hanken / JetBrains Mono) — weights are already capped, but on the *marketing* site subset aggressively and lazy-load below-fold imagery and any AI renders so the hero LCP stays < 2.5s. The proposal page's count-up/slider motion must respect `prefers-reduced-motion` and not block INP.

### What "higher quality" looks like for us, concretely
1. **Out-design the category, not just match it** — Roofr/Jobber are clean but generic; our forged identity + documentary photography + the render-on-their-house moment is a level the category hasn't reached.
2. **Lead with the live product moment** (Roofr/Handoff do this; Jobber buries it) — address → measurement → tiered proposal in the hero.
3. **Transparent pricing on the page** (Jobber's wedge vs. ServiceTitan's demo-gate) — publish everything; it's itself a trust differentiator.
4. **Field-authentic, fast, accessible** — documentary imagery, < 2.5s LCP, reduced-motion-safe, WCAG-AA contrast on the forge palette.

---

## Sources
- Roofr pricing/features 2026 — [Roofr pricing](https://roofr.com/pricing), [RoofingSoftwareGuide](https://roofingsoftwareguide.com/reviews/roofr), [SoftwareAdvice](https://www.softwareadvice.com/construction/roofr-profile/)
- AI estimating/takeoff entrants — [Handoff: 6 best AI estimating 2026](https://handoff.ai/blog/6-best-ai-construction-estimating-software-2026-picks-compared), [DigitalPM 18 best](https://thedigitalprojectmanager.com/tools/best-ai-estimating-software/), [Togal](https://www.togal.ai/), [Kreo](https://www.kreo.net/), [Beam AI](https://www.ibeam.ai/)
- Handoff funding/profile — [Handoff $5.8M](https://www.handoff.ai/blog/handoff-raises-5-8m-for-residential-construction), [Nemetschek investment](https://www.nemetschek.com/en/news-media/ngroup-strategic-investment-handoff), [YC](https://www.ycombinator.com/companies/handoff)
- FSM pricing comparison 2026 — [RivetOps](https://www.rivetops.io/servicetitan-vs-jobber-vs-housecall-pro), [LeadDuo $299 trap](https://www.leadduo.io/en/blog/fsm-software-pricing-comparison-servicetitan-jobber-housecall-pro), [Jobber vs HCP](https://www.getjobber.com/comparison/jobber-vs-housecall-pro/)
- Financing — [Acorn Finance](https://www.acornfinance.com/contractors/), [LendingClub × Wisetack (Apr 2026)](https://www.prnewswire.com/news-releases/lendingclub-launches-home-improvement-financing-begins-underwriting-and-originating-loans-through-inaugural-partnership-with-wisetack-302754592.html)
- Vertical SaaS + embedded fintech benchmarks — [Stripe vertical SaaS benchmark 2025](https://stripe.com/lp/vertical-saas-benchmark-2025), [Stripe Sessions](https://stripe.com/sessions/2025/how-to-benchmark-your-vertical-saas-platform), [Apideck embedded finance](https://www.apideck.com/blog/embedded-finance-vertical-saas)
- Website design benchmarks — [Webstacks 25 best B2B SaaS](https://www.webstacks.com/blog/best-b2b-saas-websites), [Webstacks ServiceTitan case study](https://www.webstacks.com/case-studies/servicetitan), [WebDesignAwards SaaS](https://www.webdesignawards.io/categories/saas), [CompanyCam](https://companycam.com/), [Jobber website tools](https://www.getjobber.com/features/marketing-tools/website/)
- Performance / Core Web Vitals 2026 — [WebsiteSpeedy benchmarks](https://websitespeedy.com/blog/website-performance-metrics/), [Core Web Vitals 2026 (DigitalApplied)](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)
