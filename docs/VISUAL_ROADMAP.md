# Tradesmith Visual Roadmap: Renderings + Premium Aesthetic

> Produced by a multi-agent workflow (rendering-feasibility + design-direction + UX-integration → synthesis), grounded against the actual code.

**One goal:** turn the homeowner proposal from a clean spreadsheet into a "they already built me a picture of my finished home, and here's exactly what it costs" experience — without slowing the contractor's quoting loop or breaking the zero-secrets demo. Every recommendation is checked against the actual code (`globals.css`, `p/[token]/page.tsx`, `env.ts`, `vision.ts`, `db/types.ts`, `admin.ts`, `AcceptForm.tsx`, `verticals/configs.ts`).

---

## 1. Vision — what "visual benefits" mean for Tradesmith, and why they win deals

A roof or re-side is a 5-figure, emotional, trust-gated purchase. The homeowner is buying **certainty about an outcome they can't yet see**. Today the proposal gives them a number and prose — zero visual proof. The three levers that move "yes":

1. **See the outcome on *their own* house.** Not a generic stock roof — *their* house with the new shingle/siding/color. That "it's still my house, just finished" effect is the single most persuasive element we can add. It collapses the imagination gap that kills big-ticket close rates.
2. **Self-serve the upsell.** The proposal already computes Good/Better/Best (`estimate.tiers`) but renders them **inert** (`p/[token]/page.tsx:67-81` is display-only; the homeowner can't pick). Letting them toggle tiers — with a visible "Best" anchor and a per-tier render — lets the homeowner *upsell themselves*. Highest-ROI item in the roadmap because the data already exists; only the accept-tier wiring is missing.
3. **Look like the licensed pro in the clean truck.** Emoji logos (`configs.ts:19` `icon: "🏠"`) and flat shadowless cards (`globals.css` `.card` has no `box-shadow`) read "weekend project" to a homeowner about to wire a deposit. Premium polish is a trust proxy for "this company will do clean work."

**Why it ties to close-rate:** the render and the price reveal are the emotional peak; the trust band and tier interactivity reduce friction-to-yes. We remove the three reasons a homeowner stalls (can't picture it, can't compare it, doesn't trust it). The honesty tone the product already sets ("AI-assisted estimate confirmed on-site") is the asset that lets us add AI renders *without* triggering skepticism.

---

## 2. Recommended rendering approach

### The constraint (verified)
`vision.ts:124-160` calls `claude-opus-4-8` — **vision-input, text-output only**. There is no image generation in the Anthropic SDK. Every render path requires a **non-Anthropic** provider. Also verified: `Takeoff` (`db/types.ts`) has `satelliteImageUrl` but **no render field**; `admin.ts` has **no Storage usage**; `hasKey()`'s `Service` union (`env.ts`) is closed and must gain `"render"`.

### MVP path (ship first) — Tiered fidelity ladder, AI optional
The bottom rung is deterministic and always present, so the page is never empty and never depends on an AI call succeeding:

- **Tier 1 — Swatch/material board (no AI, day one).** A curated JSON catalog per trade (real GAF/James Hardie/CertainTeed SKUs: name + hex + product photo URL), rendered as selectable chips beside a real Street View / satellite photo. The siding configs already encode tier materials (`configs.ts`: vinyl→fiber-cement→premium). Zero hallucination risk. **This alone transforms the page.**
- **Tier 2 — AI img2img on the homeowner's real photo (the wow, behind a key gate).** **Default provider: Google Gemini 2.5 Flash Image ("Nano Banana")** — best-in-class identity preservation (edits only the roof/siding region, keeps the rest pixel-identical), prompt-driven local edit (no mask work), commercial-use rights, ~**$0.02–0.04/image**. At 1–3 renders/job that's single-digit cents/job. SynthID invisible watermark = honest provenance we keep.
  - Wrap in a thin `RenderProvider` interface to later swap to **FLUX.1 Kontext via fal.ai** (~$0.03, fastest ~3–8s) or **OpenAI gpt-image-1.5** (native mask for surgical "roof-only" control; build against 1.5, not the deprecating gpt-image-1).

**Stack flow (mirrors `vision.ts`):**
```
src/lib/render/provider.ts   // RenderProvider.editHouse({ imageBase64, prompt, mask? }) -> PNG bytes
src/lib/render/prompts.ts    // per-trade + per-material/color prompt builder
src/lib/render/catalog.ts    // Tier-1 swatch JSON (SKU, hex, product photo) per vertical
src/app/api/render/route.ts  // POST { jobId, trade, materialKey, colorKey } -> { status, url }
```
Route logic: `hasKey("render")` false → return Tier-1 swatch board (never error; add `"render"` to the `Service` union + `renderKey` to `env`). Source image: roofing → reuse `staticImageUrl()`; siding/paint/windows → homeowner's uploaded front photo. `fetchImageBase64()` (already exported) → base64 → `provider.editHouse()` with an identity-preserving prompt → upload to a new Supabase Storage bucket `renderings/{jobId}/...` via `createAdminClient().storage` (first Storage use). Persist `renderImageUrl/renderPrompt/renderStatus` on `Takeoff`. **Cache by `(jobId, trade, material, color)`** so re-opening never re-bills.

**Async, never in the quoting loop.** Generate **on proposal-create** (fire-and-forget), not on measure. Adding 5–25s of image-gen to the measure step would gut "quote before you leave the driveway." Contractor advances immediately; a "Generating preview…" chip resolves in the background.

### Premium path (later)
- **Renoworks Pro embed** — manufacturer-blessed SKU/color fidelity (accuracy ceiling AI can't hit); a sales/contract cycle, don't block MVP on it.
- **Hover integration (not rebuild)** — true measured 3D re-skins; photogrammetry is a multi-year capital moat. A 2-D AI re-skin gets ~80% of perceived value for ~0.1% of effort.

### Honest stance on AI-render authenticity
The risk is over-promising → walkthrough dispute/chargeback in a bonded trade. Mitigations baked into the product: persistent *"AI visualization — actual color & finish may vary; see physical sample"* badge; always anchor to a real swatch; minimal-edit over beautified hero shots; never invent dormers/rooflines.

---

## 3. Design-system uplift spec

Target: **"the licensed pro who shows up in a clean truck"** — warm, substantial, tactile. Keep the warm paper/ink base + the per-contractor `--brand` override. Upgrade the centralized `.card`/`.btn`/`.badge` utilities so every screen lifts at once.

### 3.1 Tokens — drop-in for `globals.css` `:root`
Add a **warm-tinted elevation ramp** (`--shadow-xs…lg`, `--shadow-brand`), a `--surface-sunken` for line-item wells, a `--trust` deep-pine accent (warranty/seals so orange isn't carrying credibility alone), a rationalized radius scale (`--radius-sm/btn/card/hero`), and a display type scale.

### 3.2 Type — move off default Geist
Pair **Bricolage Grotesque** (display/headlines/price — architectural) + **Inter** (body/UI with `tnum` for money so columns never reflow). Both via `next/font/google` in `layout.tsx`. This single change differentiates from `create-next-app` instantly.

### 3.3 The most transformative two lines — give `.card` depth + `.btn` motion
```css
.card { box-shadow: var(--shadow-sm); }            /* was: nothing */
.card-hero { box-shadow: var(--shadow-lg); }       /* proposal hero */
.btn-primary:hover:not(:disabled) { box-shadow: var(--shadow-brand); transform: translateY(-1px); }
```

### 3.4 Motion — `framer-motion`, exactly three places (never decorative)
1. Proposal hero entrance (fade/slide up, 60ms stagger). 2. **Price count-up** ($0→total over ~600ms). 3. Before/After render reveal (draggable slider). All respect `prefers-reduced-motion`. **Never** animate the contractor wizard (used 8×/day; speed > wow).

### 3.5 Kill every emoji → Lucide (`lucide-react`)
Line icons inherit `currentColor` (take `--brand`/`--trust`). Map `configs.ts` trade icons → Lucide refs (`Home`/`Layers`/`CloudRain`/`Wrench`…); proposal monogram → real `logoUrl` when present, else designed monogram.

### 3.6 Redesigned homeowner proposal page (`p/[token]/page.tsx`)
Document → experience: sticky brand header w/ logo + trust line + scroll-riding price/Accept chip; **HERO render** (full-width before/after slider of the actual house, falls back to swatch board, not a dashed gray box); offer card promoted to `.card-hero` with count-up price + **interactive** tier cards (selected tier *lifted*, value-framed, financing teaser); **trust band** (warranty/licensed/reviews); scope-as-story; sunken line-item table; ceremonial e-sign. **Clamp the per-contractor brand color** at runtime so a garish input never breaks the page.

---

## 4. Prioritized build plan (impact × effort)

### P0 — "Showroom proposal" (one sprint; no new infra)
- **Token + `.card`/`.btn` uplift** in `globals.css` + font wiring in `layout.tsx`. One file lifts every screen. **~1 day.**
- **Interactive Good/Better/Best** on the proposal — data exists; the one new wiring: thread the chosen tier from `AcceptForm` (currently posts only `{ signatureName }`) → accept route re-derives the deposit from it. **~1–1.5 days. Highest ROI.**
- **Tier-1 swatch/material board** per trade (catalog JSON + chips). The permanent render fallback. **~1 day.**
- **Before/After slider component**. **~0.5 day.**

### P1 — "Trust + the wow"
- **Trust fields + trust band** — extend `Contractor` with rating/reviews/yearsInBusiness/insured/warranty + testimonials; render on proposal + pay. **~1 day.**
- **Front-of-house photo pipeline** — photo upload on the wizard + optional Street View Static fallback (verify display terms). **~1 day.**
- **AI img2img render (Gemini "Nano Banana")** behind `hasKey("render")`, `RenderProvider` interface, async on proposal-create, `renderings` bucket, `renderStatus`, "AI visualization" labeling. **~2–4 days.** De-risked because the swatch board is always the fallback.
- **Financing "from $X/mo"** on the proposal price card (today only in the pay modal). **~0.5 day.**

### P2 — Reinforcement + breadth
Carry the render thumbnail into accept + pay; premium pass on pay/landing/dashboard (emoji removal, elevation on nav); provider swap to FLUX/gpt-image-1.5 once volume justifies tuning.

---

## 5. Risks + mitigations

| Risk | Mitigation |
|---|---|
| Over-promising render → walkthrough dispute/chargeback | Persistent "AI visualization" badge; pair with real swatch; minimal-edit; never invent rooflines; keep SynthID |
| Contractor friction / quoting speed | Never render in the quoting loop — async on proposal-create; "Generating preview…" chip; opt-in |
| Front-of-house photo gap (satellite is top-down) | One-field photo upload on wizard; Street View fallback; roofing ships on existing satellite tile |
| Per-render cost | ~cents/job; cache by (jobId, trade, material, color); per-plan quota |
| Latency / failure | Tier-1 swatch is instant + deterministic; `renderStatus` states; `hasKey("render")` gate → swatch fallback, never an error |
| Empty/degraded states look cheap | Warm `--surface-sunken` panel + `Home` icon + address, never a dashed gray box |
| Garish contractor brand color | Runtime lightness clamp + derived on-color contrast |

**Start tomorrow:** edit `globals.css` `:root` + `.card`/`.btn` and wire fonts in `layout.tsx` (one afternoon, lifts every screen). In parallel, make the tier strip interactive and thread the chosen tier through `AcceptForm` → accept route. That's the P0 visual leap with zero new infrastructure, and it sets up the swatch board → async AI render path behind `hasKey("render")` for P1.
