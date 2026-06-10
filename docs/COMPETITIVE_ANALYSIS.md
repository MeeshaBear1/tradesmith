# Tradesmith Competitive Analysis & Pricing-Pressure Report

> Produced by a 12-agent workflow (6 research segments → adversarial verification of decision-critical pricing claims → senior-strategist synthesis). Prepared June 2026. Confidence tags inline: `[web]` = current-source-confirmed; `[est]` = triangulated/modeled; `[low-conf]` = directional only, verify before using in a deck. Where research briefs and verified claims conflict, the **verified claims govern**.

---

## 1. Executive Summary (SCQA)

**Situation.** Tradesmith enters a home-services software market that has already resolved into a clear shape: every serious player is an *embedded-fintech company wearing a SaaS costume*. Payments at ~2.9% + $0.30 and Wisetack-resold consumer financing are the universal default from ServiceTitan down to Jobber and Housecall Pro. In roofing specifically, **Roofr has already shipped Tradesmith's exact thesis** — free CRM, $13–19 aerial measurement reports, embedded payments, and homeowner financing — at the precise SMB-long-tail ICP Tradesmith targets, and is funded ($23.5M) and shipping `[web]`.

**Complication.** Three of Tradesmith's four claimed differentiators are already commoditized or contested:
- **Payments "own 2-3% of every job"** is *gross volume, not margin*. Net spread after interchange + processor is ~0.5–1.0% `[est]`. It is a retention utility, not a profit engine.
- **AI roof measurement** is a sub-$15 commodity (Roofr $13, GAF $18, RoofSnap $13) trending toward free, and single-tile satellite AI is structurally *less* accurate than EagleView stereo (~98%) or Hover on-site photogrammetry.
- **"Own the lending"** is, at launch, vaporware (currently mocked). The fat margin (financing dealer fees) accrues to the *loan-holder and funding partner*, not the software displaying the "Apply" button. Real capture requires a bank partner + balance sheet — a multi-year, regulated, capital-intensive build.

Only one differentiator is genuinely defensible and uncrowded: **multi-trade breadth (16 trades) + the Plansmith/Omniscient construction-engine credibility moat + the unowned contractor materials-float lending lane.**

**Question.** How should Tradesmith price and position to land the SMB long-tail without (a) competing on a commodity (measurement, payments), (b) overpromising owned lending it hasn't built, or (c) dying of CAC×churn in the lowest-ARPU/highest-churn segment in SaaS?

**Answer (thesis).**
1. **Stop pricing the software; price the transactions** — but be honest that payments net is thin and financing is the only fat pool.
2. **Give measurement away as a lead magnet**; never let it carry the P&L.
3. **Lead positioning with multi-trade breadth + estimate-accuracy (the engine), not "we also take payments."**
4. **Phase the fintech:** rent the rails (Stripe Connect + Wisetack) at launch; build toward owned spread (PayFac + bank partner + contractor materials-float lending) only when volume justifies the compliance build.
5. **Win on CAC, not price** — PLG, free takeoff as the funnel, supplier-embedded distribution — because at $99/mo and 5%/mo churn, LTV (~$2k) cannot absorb paid CAC unless fintech attach lifts ARPU 2–4×. **Fintech attach is survival, not upside.**

Single highest-leverage move: **de-mock financing as principal (spread-keeper), not referral** — because if Tradesmith merely embeds Wisetack, it *becomes Jobber*: a referrer earning a crumb, not the thesis.

---

## 2. Market Map — Five Segments

| Segment | What it is | Who wins today | Tradesmith's posture |
|---|---|---|---|
| **1. All-in-one Field-Service OS** | Horizontal back-office | ServiceTitan (up-market); Jobber, Housecall Pro (SMB) | Direct competitor down-market |
| **2. Roofing vertical platform** | Roofing measure→proposal→pay | Roofr, JobNimbus, AccuLynx, Leap | Roofr is the existential comp |
| **3. Aerial measurement / takeoff** | Measurement reports | EagleView, Hover, Roofr, GAF, RoofSnap | Commodity input; do NOT compete |
| **4. Embedded payments + financing** | The fintech rails | Wisetack, GreenSky, Service Finance, Hearth; native pay | The thesis; must own spread, not resell |
| **5. Visual sales / rendering** | Branded proposals + render | Hover, SumoQuote, Renoworks, Leap, Roofle | Adjacent; build-gap, not engine reuse |

### Master competitor table (verified figures)

| Competitor | Target shop | Seat/sub pricing | Payments take rate | Financing | Threat |
|---|---|---|---|---|---|
| **ServiceTitan** | Mid→enterprise | ~$245–$500+/tech/mo; $5K–$50K+ impl; ~$30–70K+/yr for 10 techs `[web]` | Custom interchange-plus ~0.25–0.75% markup (NOT flat 2.9%) | Service Finance, Synchrony, Affirm BNPL (Sep 2025) | **Low** — ignores long-tail; positioning foil |
| **Housecall Pro** | 1–20 techs | Basic $59–79, Essentials $149–189, Max ~$329 | **2.59% swiped / 2.99% online / 3.49% keyed+Amex / 1% ACH** | Wisetack; Stripe Capital | **HIGH** — same buyer + fintech playbook |
| **Jobber** | 1–15 techs | Core $39, Connect $119/169, Grow $199/349, Plus $599 | **2.9%+$0.30 online; 2.7%+$0.30 Tap; 1% ACH** | Wisetack (flat 3.9%) | **HIGH** — owns the horizontal-SMB slot |
| **Roofr** ⚠️ | Solo→SMB roofers (exact ICP) | **$0 Starter**; $109 / $209 / $299–349 | **2.8%+30¢ card / 0.5% ACH / Amex 3.25%** | GoodLeap; report-credit loss-leader | **HIGHEST — existential** ($23.5M funded) |
| **JobNimbus** | Small→large roofers | ~$99/$199/$499 `[est]` | JobNimbus Payments | Native in-app financing; owns SumoQuote; ABC-Supply/QXO backing | **HIGH** — most complete bundle + capital |
| **AccuLynx** | Mid→enterprise | Essential $250; Pro ~$60–120/user | Integrated | Integrations; RoofScope embedded | **Med** — up-market |
| **Leap** | Mid in-home-sales | CRM $79/$298 +$99/user; SalesPro ~$750 | Leap Pay | **GreenSky in-proposal**; 12 lenders | **Med-High** — owns financing-in-proposal close |
| **Hover** | Solo→enterprise exterior | $29 one-time; Pro ~$99/mo | Native proposals/e-sign | Partner financing | **HIGH** on visual-sales/end-to-end |
| **EagleView** | Insurance/large | ~$15–87/report | None | None | **Low-Med** — potential backend tile supplier |
| **GAF QuickMeasure** | GAF-certified | ~$18/report | None (loss-leader) | — | **Med** — proves measurement is a giveaway |
| **RoofSnap / iRoofing** | Solo→small | $13/report; iRoofing ~$129/mo unlimited | None | — | **Low** — takeoff only |
| **SumoQuote** | Solo→mid roofers | ~$85–175/mo (inside JobNimbus) | — | — | **High** on the proposal deliverable |
| **Roofle** | Solo→mid roofing | $350/mo + $2K setup | — | ContractorLoan PRO | **High** on instant-quote lead-gen |
| **Joist** | Solo/micro GC | **$8 / $15 / $32 flat** | Card/eCheck/3rd-party | 3rd-party | **Med** — budget price anchor |
| **Wisetack** | SMB; embeds in SaaS | No subscription | n/a | **3.9% std → 4.9% (6mo) → 6.9% (12mo) → 9.9% (24mo 0%)**; $500–$25K | **HIGH** — the partner AND the spread you want |
| **Hearth** | Solo–small GCs | **$1,499–$4,999/yr; NO per-loan dealer fee** | — | Lender marketplace; "keep 100%" | **HIGH** — neutralizes the dealer-fee objection |
| **GreenSky** | Mid–large dealers | $39 activation | n/a | **Dealer fee ~0–26.6%** (2–10% common) | **Med** — sets dealer-fee ceiling |
| **Service Finance** | HVAC/roof/window dealers | n/a | n/a | Dealer fee ~1.25–24%; FHA Title I | **Med** — broadest menu, large-ticket |

⚠️ **Roofr is the single competitor to benchmark on every axis** — same ICP, price band, workflow, and fintech monetization, live and funded.

---

## 3. Where Tradesmith Fits — Defensible Wedge & Exposure

- **OS (vs Jobber/HCP):** Exposure HIGH (same buyer/price/playbook, more distribution). Wedge = trade-specific **AI takeoff + code-grounded estimating** → "accurate estimates, fewer callbacks," not "we also do scheduling."
- **Roofing (vs Roofr/JobNimbus):** Exposure HIGHEST — Roofr *is* the thesis, shipped. Wedge = **not being roofing-only**; 16-trade breadth, back-office-first. Roofing is one trade Tradesmith does, not its identity.
- **Measurement:** Exposure HIGH on the feature, LOW on the thesis — street price ~$13, single-tile satellite is the weakest accuracy position. Wedge = free funnel input + **AI takeoff for the 15 non-roofing trades** (roofing-locked incumbents can't follow). Mitigate accuracy with manual-correction overlay + confidence + optional licensed-tile upgrade.
- **Fintech:** Exposure HIGH/structural. Payments commodity; financing margin accrues to the funder. Wedge = the **one lane no SMB incumbent occupies — contractor materials-float lending** (working capital against the supply purchase), tied to supplier-embedded distribution.
- **Visual sales:** Exposure MED, a build-gap. Hover is the bar; the Omniscient engine is *generative/structural, not a from-photo material-swap renderer* — so this is a **new build, not a reuse**. Near-term deliverable = branded G/B/B proposals at SumoQuote's aesthetic bar; don't lead the pitch with rendering you haven't built.

### The one-sentence defensible position
> **"The back-office-first Trades OS for the 16-trade SMB long-tail that ServiceTitan ignores — grounded in real building-code knowledge for accurate estimates, with payments and *contractor-side* financing built in."**

Three pillars in priority: (1) multi-trade breadth, (2) estimate-accuracy via the engine moat, (3) contractor materials-float lending. Payments and measurement are *features*, not the spear.

### Most exposed (ranked)
1. **CAC × churn in the long-tail** (existential). 2. **Roofr** doing the identical thesis, funded. 3. **Owned lending is mocked** — fat margin unbuilt/regulated. 4. **Mile-wide/inch-deep** vs roofing depth. 5. Incumbents adding cross-trade AI within 12–18 mo.

---

## 4. Pricing-Pressure Analysis — Four Compressing Forces

| Force | Direction | 12–24mo end-state | Implication |
|---|---|---|---|
| **(a) Seat price** | ↓ toward $0 solo (Roofr $0, Joist $8–32) | $0 solo / $99–199 crew | Subscription = retention, not profit |
| **(b) Payment take** | ↓ net (~0.5–1.0% → ~0.4–0.7%) | thin commodity utility | Don't anchor the model on it |
| **(c) Financing spread** | flat-rich (Wisetack 3.9→9.9%, GreenSky to ~26%) but **embedder share thin** | fat *only if* you own MoR | **Highest-leverage; de-mock as principal** |
| **(d) Measurement** | ↓↓ to free | bundled funnel input | Give away; lead with cross-trade + engine |

**Key corrected number:** "own 2–3% of every job" on payments is **gross volume; net is <1%**. On a $12K roof, 2.9% gross ≈ $348 but Tradesmith's **net is ~$85–155** `[est]`. Modeling on 2–3% overstates real margin **3–5×**.

**Financing is the only fat pool — and it's NOT compressed by Wisetack** (dealer fee *rises* with longer 0% promos). The real compression force is **Hearth** (subscription, no dealer fee → "keep 100%"). The embedder's share stays a crumb **unless Tradesmith becomes merchant-of-record / spread-keeper** via a bank partner. Wisetack's **$25K ceiling** leaves solar/large-remodel ($20–100K, 15–30% fees) uncaptured.

---

## 5. Concrete Pricing Recommendation

### Seat tiers
| Tier | Price | Who | Role |
|---|---|---|---|
| **Solo** | **$0/mo** | 1 user, 1–3 trucks; full takeoff/estimate/proposal/invoice, **payments required to transact** | Acquisition funnel — converts to the payments+financing relationship |
| **Crew** | **$99/mo** (~$79 annual) | 2–10 users; multi-user, scheduling, QuickBooks, priority support | Holds the $99 anchor; **per-business, not per-seat** (beats Jobber/HCP per-seat climb) |
| **Shop** | **$249/mo** | 10–25 users; multi-location, materials-float access, onboarding, API | Captures shops before ServiceTitan's range |

**Guardrails:** publish everything (no demo-gate / contract / implementation / exit fee — itself a wedge vs ServiceTitan opacity); per-business pricing at Crew; annual discount caps ~20%.

### Payments
**Hold at market: 2.9%+$0.30 online, 2.7%+$0.30 tap, 1% ACH (cap ~$25–40).** Do NOT undercut — buyers don't switch OS for 10bps, and net is already <1%. Method-tier transparently (keyed/Amex higher) like HCP. Internal target net ~0.5–0.8%.

### Financing — phased
- **Phase 1 (launch → ~$50M GMV):** Embed **Wisetack** (homeowner, $500–$25K), contractor pays the 3.9–9.9% dealer fee, Tradesmith negotiates rev-share/referral. Ships in weeks, no balance sheet. *A crumb — be honest internally.*
- **Phase 2 (the actual thesis):** Become **merchant-of-record / spread-keeper** via a chartered bank partner + forward-flow/warehouse line (ECOA/UDAAP compliance). **Launch contractor materials-float lending** (the unowned lane), paired with **supplier-embedded distribution** (supplier = lead channel + repayment funnel). Add a second large-ticket lender (SFC/GreenSky-class) to break the $25K ceiling.
- **Investor framing:** payments is a <1% net utility; homeowner financing reaches parity fast via Wisetack; **owned spread + contractor float is the real value and a capital-gated Phase 2.** Never pitch owned lending as Day-1.

### Bundling & anti-race-to-the-bottom
Bundle measurement+estimate+proposal+payment into one free flow (measurement never a line item). Sell the engine as **"accuracy / no-callback re-bids,"** not "code knowledge." Attach financing at the proposal step; cross-sell float-lending at the materials-order step. **Don't compete on the commodities** (measurement, payments) — differentiate on breadth + accuracy + float-lending. Make the free tier a *funnel* (track free→first-payment as the #1 metric). Capture margin in the transaction layer where willingness-to-pay is invisible. **Win on CAC, not price.**

---

## 6. Top 5 Risks + Counter-Moves

1. **CAC × churn (EXISTENTIAL)** — at $99 + 5% churn, LTV ~$2k can't absorb paid CAC. → Fintech attach must lift ARPU **2–4×** (payments-on-signup non-optional to transact); **zero-CAC distribution** via PLG + **materials-supplier embedding** (counter to ABC-Supply-backed JobNimbus); no paid-acquisition scale until CAC payback < 12 mo.
2. **Roofr owns the thesis in roofing** — live, funded, freemium. → Don't fight on roofing; reframe as **16-trade, back-office-first**; lead with HVAC/plumbing/electrical/concrete the roofing-bound players can't serve + the engine.
3. **Owned lending is mocked** — the fat margin is unbuilt. → Phase it (rent Wisetack now; build MoR + bank partner + **contractor materials-float** as the headline differentiator). Never represent owned lending as shipped before it is.
4. **Mile-wide/inch-deep** — → Go deep on **2–3 anchor trades** (roofing + exterior) first using the engine as the depth multiplier, then expand. Don't launch 16 at equal shallow depth.
5. **Hearth + incumbent fast-follow** — Hearth kills the dealer-fee objection; HCP/Jobber can bolt on roofing AI in 12–18 mo. → Answer "why not Hearth?" (no engine/takeoff; we add contractor-side float); deepen the engine moat so a bolt-on partnership stays visibly shallower; move first on float + supplier distribution.

---

## Confidence & Caveats
- **Verified corrections (govern):** payment rates are method-tiered not flat 2.9%; ServiceTitan is custom interchange-plus; **Wisetack dealer fee RISES with 0% term (3.9→9.9%), is not low/zero**; **Hearth monetizes via subscription with NO dealer fee**; GreenSky range ~0–26.6%.
- **`[low-conf]` — verify before any external deck:** net payments-spread decomposition, PayFac timelines, Wisetack embedder rev-share, JobNimbus tier prices, and all vendor-reported conversion-lift % (Wisetack "4.5× larger jobs," visualization "+31% close") — directionally real, magnitudes inflated.
- **The one number to internalize:** payments net is **<1%**, not 2–3%. The thesis lives or dies on **financing spread + contractor materials-float** — currently unbuilt and capital/regulation-gated.
