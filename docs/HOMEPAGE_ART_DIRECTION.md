# Tradesmith Homepage — Art Direction Brief (Phase 1)

> Reference north star: **www.higharc.com** (full-page screenshot supplied). This brief
> (1) reverse-engineers Higharc into concrete, measurable decisions, then (2) proposes the
> IA + section-by-section composition for the Tradesmith homepage, derived from Higharc's
> **structural language** — rendered in Tradesmith's own **"Cold Steel & Forge Fire"** brand
> (`BRAND.md`), never a copy of Higharc's palette. **No code until approved.**

---

## PART A — Reference deconstruction (Higharc)

### A1. Typography
Higharc runs a **two-typeface system**: a heavy **geometric-grotesque display** (reads like Aeonik / Söhne / Neue Haas Grotesk Display — tight, confident, slightly condensed caps) and a **neutral grotesque body** (Inter/Söhne-class). Inferred scale on a 1920px canvas:

| Role | Size (px) | Weight | Line-height | Tracking | Case | Where |
|---|---|---|---|---|---|---|
| Mega statement | ~130–160 | 800 | 0.95 | −0.03em | UPPER | "TAKE CONTROL… PLATFORM" |
| Hero H1 | ~64–76 | 700–800 | 1.02 | −0.02em | UPPER | "THE HOMEBUILDING INTELLIGENCE PLATFORM" |
| Section H2 | ~44–56 | 700 | 1.05 | −0.02em | Mixed | "ONE DIGITAL MODEL…" |
| Product-row H3 | ~28–34 | 700 | 1.12 | −0.01em | Sentence | "Design, change and manage plans 10× faster" |
| Stat number | ~72–96 | 800 | 1.0 | −0.02em | — | "4K+ / 10X / 3X / 50%" |
| Section label | ~13–14 | 600 | 1.2 | +0.12em | UPPER | green "PURCHASING & ESTIMATING" |
| Body-lg | ~20 | 400 | 1.5 | 0 | — | hero/intro paragraphs |
| Body | ~16–17 | 400 | 1.6 | 0 | — | card + row copy |
| Nav / button | ~15 | 500 / 600 | 1 | 0 | — | nav, CTAs |

**Signature:** display is set in **all-caps, very tight tracking, very tight leading** so headlines read as a *built block*, and the mega-statement is set large enough to collide with imagery.

### A2. Grid & layout
- **12-column grid**, content max-width ≈ **1200–1280px**, gutter ≈ **24px**, outer margin scaling ~24→80px.
- **Deliberate symmetry breaks:** (a) hero is an asymmetric **~7/5 split** (headline left, device image right, image bleeding off the right edge); (b) the **product rows alternate** text-left/visual-right then flip, and the product visualization **bleeds past the column into the margin**; (c) the **testimonial block is an asymmetric masonry** (unequal card heights/widths, a video tile, solid-color cards interleaved with white) — explicitly *not* a 3-equal-card row.
- Composition by section type: **hero** = split + full-bleed logo strip pinned at its base; **statement** = centered measure ~10 cols, oversized; **product rows** = 6/6 with bleed; **stats** = single full-width band, 4 evenly weighted numbers; **proof** = masonry; **closing CTA** = full-bleed image band with an inset card.

### A3. Color
Observed palette (sample exact hex from the live site before build):
- Near-black base w/ green undertone **≈ #0F1411**
- Bright leaf/lime accent **≈ #8FD14F** (CTA pills, highlighted words, section labels, solid quote cards)
- Off-white **≈ #F5F6F2**, pure white cards **#FFFFFF**
- Ink text **≈ #14181A**, muted gray text **≈ #6A726E**, grayscale logo wall.

**How color is *used*:** the system is **near-monochrome** (dark base ↔ light sections) and **the single green carries 100% of the accent load** — CTAs, one highlighted word per headline, small-caps labels, and a few solid cards. Everything else is neutral. **Photography carries all other color** (homes, crews, renders), so the green never competes with imagery. Discipline is the whole effect.

### A4. Spatial system
- Section vertical padding ≈ **120–160px** desktop (≈80px mobile). Generous, editorial density — one idea per surface.
- **8px base unit**; intra-section rhythm in 8/16/24/40/64 steps.
- Strong **dark→light→dark cadence**: dark hero → dark intro/statement → light "cloud" rows + stats + proof → dark closing/footer. The luminance flips *are* the chapter breaks.

### A5. Signature moves (the 5 that make it feel like itself)
1. **Mega-type meets organic illustration + bleed imagery** — an oversized all-caps statement with **one word boxed/outlined in the accent**, overlapping a green vine/leaf illustration motif.
2. **Alternating full-width product rows** ("The Homebuilding Cloud") — colored small-caps label → headline → tight body → bullets → "Learn more", paired with a **large, real product visualization** that bleeds into the margin; direction flips each row.
3. **Asymmetric proof masonry** — solid-accent cards + white cards + a **video tile** + headshots, unequal sizes, mortared together.
4. **Big-number stats band** — 3–4 oversized numerals on one light band, the quantified promise.
5. **Full-bleed closing CTA over photography** — a band of home/site imagery, an inset card, one accent button ("Build your future with Higharc").
   *(+ a persistent **luminance-flip rhythm** and a **grayscale trusted-by logo wall** pinned under the hero.)*

### A6. Motion
- **Scroll-reveal**: fade + rise ~24px, **~600ms**, ease-out-expo `cubic-bezier(0.16,1,0.3,1)`, **80ms stagger** within a group.
- **Stat count-up** on enter (~1000ms).
- **Nav** condenses/gains background on scroll (~200ms).
- **Card/nav hover**: lift + accent ~150ms. **Product visuals**: subtle parallax (~0.05–0.1 factor).
- All gated by `prefers-reduced-motion`. Motion is reveal-and-emphasis only — never decorative loops.

### A7. Imagery & art direction
- **Photography-led** (real people, homes, sites) + **product UI screenshots** shown large + **3D massing renders** + one **illustration motif** (the vine). No stock-smile clichés.
- **Treatment:** full-color, natural light, consistent grade; UI shown crisp at large scale.
- **Crop logic:** one edge **bleeds off-canvas**, the opposite side holds generous negative space; subjects are hands/work/finished outcomes.

---

## PART B — Tradesmith homepage (structure from Higharc, brand from us)

**1:1 brand mapping (the only substitutions):** Higharc dark-green base → **Forged Graphite `#1A1D22` / `#15181C`**; Higharc leaf-green accent → **Forge Orange `#EA4E1C`** (already disciplined in `BRAND.md` as "the spark" — a perfect single-accent swap); light ground → **Cold Concrete `#F0F2F4`**; secondary → **Blueprint Steel `#34566B`**; Higharc's **vine illustration motif → our hairline blueprint-grid / forged texture** (on-brand equivalent, not a copy). Type: **Archivo** (display, already loaded — matches Higharc's heavy grotesque) + **Hanken Grotesk** (body) + **JetBrains Mono** (spec labels/stats). Audience shift to honor: Higharc sells enterprise homebuilders; **Tradesmith sells SMB contractors** — keep the *grandeur and structure*, make the *voice* the plain-spoken foreman of `BRAND.md`.

### Information architecture
- **Top utility ribbon** (optional, thin): one announcement + link.
- **Primary nav** (dark, condenses on scroll): `Tradesmith` wordmark · **Product** · **Trades ▾** (the verticals) · **How it works** · **Pricing** · **Resources** · **Log in** · **[ Start free ]** (forge-orange pill) + quiet "Book a demo" text link.
- **Footer:** wordmark + tagline · newsletter signup · columns **Product / Trades / Company / Legal** · social · "Forged for the field."

### Section-by-section composition
1. **Hero — dark, asymmetric 7/5, full-viewport-ish.** Left: mega all-caps Archivo H1 (**"THE TRADES OPERATING SYSTEM"** or **"FORGED FOR THE FIELD"**) with **one word struck in forge-orange**; one-line subhead in the foreman voice; **one** primary CTA (`Start free`) + a quiet "see a 60-second quote" text link (**no dual-CTA + checkmark-badge row**). Right: a real product moment bleeding off the right edge — the **address → measurement → tiered proposal** shown as an actual UI frame over a faint blueprint grid. Pinned at the hero's base: a **grayscale trusted-by wall** (contractor/brand/supplier logos), full-bleed.
2. **Thesis statement — dark, oversized centered measure.** "**QUOTE IT FROM THE TRUCK. GET PAID BEFORE YOU PACK UP.**" with a forge-orange highlighted phrase. Sets the chapter.
3. **Signature mega-type moment — dark→texture.** A single colossal Archivo line (e.g. **"FROM THE DRIVEWAY TO DEPOSITED"**) overlapping the **blueprint-grid/forged texture** and a bleeding jobsite photo, one word **boxed/struck** in forge-orange. (Our equivalent of Higharc's vine + boxed word.)
4. **The workflow — light, asymmetric editorial row (NOT icon cards, NOT 01/02/03).** Four beats — **Measure · Quote · Propose · Get paid** — as an alternating-width band: each beat = a real photo/UI crop + a short verb headline + one line, with uneven column widths and a connecting baseline. Reads left-to-right as the job's life.
5. **Proof / stats band — light, one full-width band.** 3–4 oversized JetBrains/Archivo numerals: **"60-sec quote · 16 trades · same-day deposit · +X% close-rate."** The quantified promise.
6. **The Trades OS — light, alternating full-width product rows (the spine).** Four rows, direction flipping each time, each = forge-orange small-caps label → headline → two-line body → "see it →" → a **large product visualization bleeding into the margin**:
   - *Forged for the trade* → the AI takeoff + editable rate card.
   - *Look like the pro* → the interactive Good/Better/Best proposal + the on-their-house render.
   - *Get paid, not chased* → same-day deposit + finance-this-roof.
   - *One screen, every trade* → the multi-trade quoting view.
7. **Multi-trade breadth — dark band.** Not an icon grid: a **typographic wall / slow ticker** of the 16 trade names in Archivo, with one or two photographed, expressing range without clutter.
8. **Proof masonry — light, asymmetric.** Contractor quotes in **graphite + forge-soft** cards of unequal size, one **video tile**, real headshots — mortared, never a 3-equal row.
9. **Resources — light, 3 editorial cards** (optional): real imagery, tag, title, date.
10. **Closing CTA — full-bleed photography band.** Finished-home / clean-truck imagery, an inset **forged-graphite card**: "**Forge your shop's future.**" + one forge-orange `Start free`.
11. **Footer — dark**, per IA above.

### System specs for the build (when approved)
- **Grid:** 12-col, content max **1280px**, full-bleed wrapper **1536px**, gutter **24px**, outer margin `clamp(20px, 5vw, 80px)`.
- **Type scale (Archivo display / Hanken body), responsive clamps:** Mega `clamp(64px, 11vw, 150px)/0.95/−0.03em`; H1 `clamp(40px, 6vw, 72px)/1.02/−0.02em`; H2 `clamp(32px, 4vw, 52px)/1.05`; H3 `clamp(24px, 2.4vw, 32px)/1.12`; Stat `clamp(48px, 7vw, 88px)` tnum; Label `13px/+0.12em/upper` mono; Body-lg `20px/1.5`; Body `17px/1.6`.
- **Spacing:** section padding `clamp(80px, 12vw, 160px)`; 8px base unit.
- **Color roles:** graphite base + concrete light alternating; forge-orange = single accent (CTA, one highlighted word/section labels, selected states) — **never wallpaper**; steel for secondary/links; photography carries all other color.
- **Motion:** scroll-reveal fade+rise 24px / 600ms / ease-out-expo / 80ms stagger; stat count-up 1000ms; nav condense 200ms; card hover lift 150ms; reduced-motion safe.
- **Imagery:** documentary jobsite/crew/finished-home photography (cool-steel grade, warm key) + crisp large product UI + the blueprint-grid texture motif; bleed one edge, negative space opposite. (No image-gen here → ship on-brand SVG/placeholders + the AI prompt list in `docs/art-direction.md` until real photography lands.)

### Phase-2 guardrails (banned, per your brief)
No eyebrow→headline→body repeated every section · no emoji icons · no 01/02/03 numbered feature lists · no icon-card grids · no dual-CTA hero with checkmark trust-badge row · no all-centered single-column stacks · no soft-shadow rounded cards as the primary layout device. The composition above is built specifically to avoid all seven.

---

**Awaiting your approval of this brief before any Phase-2 code.** Tell me what to adjust — palette emphasis, which sections to cut/add, the hero headline, or how literally to track Higharc's grandeur vs. lean into the forged identity.
