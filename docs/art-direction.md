# Tradesmith — Art Direction & Implementation Spec

*The build-facing companion to [`BRAND.md`](../BRAND.md). This is what goes into the code: tokens, fonts, component rules, motion, iconography, AI image prompts, and SVG placeholders. Theme concept: **Cold Steel & Forge Fire**.*

**Reskin strategy (per portfolio convention):** keep the existing semantic token *names* stable (`--paper`, `--ink`, `--brand`, `--muted`, `--line`, `--surface`) and **swap their hex values** — every screen lifts at once, no component churn. Add *new* tokens (`--trust`, `--surface-sunken`, shadow ramp, radius scale, font vars) as clean additions.

---

## 1. Design tokens — `globals.css :root`

```css
:root {
  /* Neutrals — COOL (the break from the warm-cream Plainsight family) */
  --paper: #F0F2F4;          /* Cold Concrete — page ground */
  --surface: #FFFFFF;        /* cards */
  --surface-sunken: #E9ECEF; /* line-item wells, inputs-on-cards */
  --ink: #1A1D22;            /* Forged Graphite — text + dark surfaces */
  --muted: #677079;          /* cool slate secondary text */
  --line: #E2E6EA;           /* cool hairline */

  /* Brand — Forge Fire (the spark; use sparingly) */
  --brand: #EA4E1C;          /* Forge Orange */
  --brand-strong: #C73F12;   /* pressed / hover-dark */
  --brand-soft: #FCEAE1;     /* heat-glow tint bg */

  /* Trust — Blueprint Steel (credibility, not carried by orange) */
  --trust: #34566B;
  --trust-soft: #EAF0F4;

  /* Dark/steel ramp (dark sections, footer, spec bars) */
  --graphite-900: #15181C;
  --graphite-800: #1A1D22;
  --graphite-700: #23272E;
  --graphite-600: #2E333B;

  /* Status */
  --ok: #15803D;     --ok-soft: #E9F6EE;
  --warn: #B45309;   --warn-soft: #FBF3E4;
  --danger: #B91C1C; --danger-soft: #FBECEC;

  /* Elevation — warm-neutral shadow on a cool base (Warmth 6, not clinical) */
  --shadow-xs: 0 1px 2px rgba(20,24,28,.06);
  --shadow-sm: 0 1px 2px rgba(20,24,28,.06), 0 2px 6px rgba(20,24,28,.06);
  --shadow-md: 0 4px 12px rgba(20,24,28,.08), 0 2px 4px rgba(20,24,28,.06);
  --shadow-lg: 0 12px 32px rgba(20,24,28,.12), 0 4px 8px rgba(20,24,28,.06);
  --shadow-forge: 0 6px 20px rgba(234,78,28,.28);   /* heat glow on primary hover */

  /* Radius — slightly squarer than before (forged/tool, rectilinear) */
  --radius-sm: 8px;
  --radius-btn: 10px;
  --radius-card: 14px;
  --radius-hero: 20px;

  /* Fonts (vars set by next/font in layout.tsx) */
  --font-display: var(--font-archivo);
  --font-sans: var(--font-hanken);
  --font-mono: var(--font-jbmono);
}
```

Expose the new color tokens to Tailwind v4 in `@theme inline` so `text-trust`, `bg-surface-sunken`, `text-display` work:

```css
@theme inline {
  --color-paper: var(--paper);
  --color-surface: var(--surface);
  --color-surface-sunken: var(--surface-sunken);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-line: var(--line);
  --color-brand: var(--brand);
  --color-trust: var(--trust);
  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

---

## 2. Fonts — `layout.tsx` (`next/font/google`)

```ts
import { Archivo, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["600","700","800"] });
const hanken  = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"], weight: ["400","500","600","700"] });
const jbmono  = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"], weight: ["400","500","700"] });
// html className: `${archivo.variable} ${hanken.variable} ${jbmono.variable}`
```

- **Display** (`font-display`, Archivo) — page headlines, the wordmark, big price numbers. Uppercase + tight tracking for the wordmark; weight 800.
- **Body/UI** (default `font-sans`, Hanken) — everything else. Money/measurements get `font-variant-numeric: tabular-nums`.
- **Mono** (`font-mono`, JetBrains Mono) — measurement readouts, SKU/spec chips, stamped uppercase labels only.

`body { font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif; }`

---

## 3. Component upgrades — `globals.css @layer components`

```css
.card        { background: var(--surface); border: 1px solid var(--line);
               border-radius: var(--radius-card); box-shadow: var(--shadow-sm); }
.card-hero   { box-shadow: var(--shadow-lg); border-radius: var(--radius-hero); }
.card-sunken { background: var(--surface-sunken); border: 1px solid var(--line);
               border-radius: var(--radius-card); box-shadow: none; }

.btn { border-radius: var(--radius-btn); font-weight: 600; /* ...existing... */ }
.btn-primary { background: var(--brand); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--brand-strong);
               box-shadow: var(--shadow-forge); transform: translateY(-1px); }
.btn-trust  { background: var(--trust); color: #fff; }
.btn-dark   { background: var(--ink); color: #fff; }

.input:focus { outline: 2px solid var(--brand); outline-offset: -1px; }

/* Stamped spec label — the "quietly smart / measured" texture */
.spec { font-family: var(--font-mono); font-size: .72rem; letter-spacing: .04em;
        text-transform: uppercase; color: var(--muted); }

/* Signature texture: hairline blueprint grid for heroes + empty states
   (NEVER a dashed gray box) */
.grid-blueprint {
  background-color: var(--paper);
  background-image:
    linear-gradient(to right, rgba(52,86,107,.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(52,86,107,.06) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

**Color discipline (the non-negotiable):** forge-orange appears on the **primary action**, the **price reveal**, and the **selected tier** — almost nowhere else. Steel/concrete/graphite carry the page; `--trust` carries credibility. If orange starts feeling like wallpaper, the "quietly smart" pole is dying — pull it back.

---

## 4. Motion — `framer-motion`, exactly three places (never decorative)

1. **Proposal hero entrance** — fade/slide-up, ~60ms stagger.
2. **Price count-up** — $0 → total over ~600ms (the emotional peak).
3. **Before/After render reveal** — draggable slider.

All respect `prefers-reduced-motion`. **Never animate the contractor wizard** — it's used 8×/day; speed beats wow.

---

## 5. Iconography — kill every emoji → Lucide (`lucide-react`)

Line icons inherit `currentColor`, so they take `--ink` / `--brand` / `--trust` cleanly. Map `verticals/configs.ts` trade icons → Lucide: roofing→`Home`, siding→`Layers`, gutters→`CloudRain`, windows→`AppWindow`, electrical→`Zap`, hvac→`Wind`, plumbing→`Droplet`, solar→`Sun`, painting→`Paintbrush`, concrete→`Box`, fencing→`Fence`, decking→`Layers3`, insulation→`Thermometer`, drywall→`Square`, flooring→`Grid3x3`, remodel→`Wrench`. The proposal monogram uses the contractor's `logoUrl` when present, else a designed maker's-mark monogram (§7).

---

## 6. AI image prompts (no text-to-image in this env — hand these to the user)

Generate with Midjourney / Gemini "Nano Banana" / FLUX and drop into `public/`. House style: **real jobsite, natural light, a little grit, cool-steel grade with a warm key light; documentary, not stock.**

- **Marketing hero:** *"Documentary photo, a roofing crew on a residential roof at golden hour, torn-off section visible, ladder and truck below, real working hands, natural light, slight grain, cool steel-grey grade with warm sun, no logos, no text, shot on 35mm."*
- **'Forged for the trade' section:** *"Close-up, a contractor's weathered hands holding a phone showing a clean estimate, on a tailgate with tools, shallow depth of field, natural window light, cool neutral palette, documentary."*
- **'Get paid' section:** *"A contractor leaning on a clean white work truck in a driveway, finished new roof behind, confident and relaxed, late-afternoon light, cool grade, candid, no stock-smile."*
- **Proposal 'after' render (per job):** img2img on the homeowner's own front photo — *"same house, same angle, identical except a new [material/color] roof; photorealistic; do not alter rooflines, landscaping, or sky; minimal edit."* Always paired with the **"AI visualization — actual color & finish may vary"** badge.

**Avoid in every prompt:** circuit boards, glowing AI orbs, hexagons, purple gradients, posed clipboard-smiles, navy+amber.

---

## 7. SVG placeholders to ship now (on-brand, zero dependencies)

Until real photography exists, ship tasteful SVGs — never empty boxes:
- **Wordmark:** `TRADESMITH` in Archivo 800, uppercase, tracking ~`-0.01em`, graphite; the `forge-orange` only on a small struck **maker's-mark monogram** (an anvil silhouette or a stamped `T`) to its left.
- **Empty states / image-pending:** the `.grid-blueprint` panel + a centered Lucide icon (`Home`/address) + the address in `.spec` mono — the documented "never a dashed gray box."
- **Trade tiles:** graphite Lucide glyph on `--surface`, `--trust` hairline, optional forge-orange corner tick on the active tile.

---

## 8. Differentiation guardrails (cross-portfolio)

This look must stay visibly distinct from its siblings — sameness erodes trust:
- **NOT** [Tomaso Built] — saturated navy `#1B2B4E` + amber `#C47D2B`, DIN, industrial deck.
- **NOT** the Plainsight / Recourse / Vellum family — warm-cream + teal + terracotta + Fraunces/Inter.
- **NOT** [Atlas] "Meridian Command" — dark-cobalt enterprise spine + Plus Jakarta + IBM Plex Mono.
- Tradesmith's ownable signature = **cool Cold-Concrete ground + Forged-Graphite + the disciplined Forge-Orange spark + Archivo "stamped" display + the blueprint grid.**
