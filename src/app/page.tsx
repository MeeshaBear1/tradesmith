import Link from "next/link";
import { SiteNav } from "@/components/marketing/SiteNav";
import { Reveal } from "@/components/marketing/Reveal";
import { CountUp } from "@/components/marketing/CountUp";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

/* ───────────────────────── small inline icons (no emoji) ───────────────────────── */
function Tick() {
  return (
    <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Pin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/* ───────────────────────── product visualization frame ───────────────────────── */
function ProductFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-hero overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--ink)" }}>
        <span className="text-xs font-medium text-white/75">{title}</span>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--brand)" }} />
      </div>
      <div className="grid-blueprint p-5">{children}</div>
    </div>
  );
}

const TIERS: [string, string, boolean][] = [
  ["Good", "$11,240", false],
  ["Better", "$13,180", true],
  ["Best", "$17,650", false],
];

function TierStrip() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TIERS.map(([t, p, on]) => (
        <div
          key={t}
          className="rounded-[10px] border p-2 text-center"
          style={{
            borderColor: on ? "var(--brand)" : "var(--line)",
            background: on ? "var(--brand-soft)" : "var(--surface)",
            boxShadow: on ? "var(--shadow-sm)" : "none",
          }}
        >
          <div className="label">{t}</div>
          <div className="tnum text-sm font-bold">{p}</div>
        </div>
      ))}
    </div>
  );
}

function HeroProposal() {
  return (
    <div className="card-hero overflow-hidden" style={{ background: "var(--surface)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--ink)" }}>
        <span className="text-xs font-semibold text-white">Apex Roofing — Proposal</span>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--brand)" }} />
      </div>
      <div className="space-y-3.5 p-5">
        <div className="flex items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: "var(--surface-sunken)" }}>
          <Pin /> 4821 SE Lincoln St, Portland OR
        </div>
        <div className="flex items-center justify-between">
          <span className="badge" style={{ background: "var(--trust-soft)", color: "var(--trust)" }}>
            AI measured · 24.0 sq
          </span>
          <span className="spec">6/12 pitch</span>
        </div>
        <TierStrip />
        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="label">Better package</div>
            <div className="display tnum text-[2rem] leading-none" style={{ color: "var(--brand)" }}>
              $13,180
            </div>
          </div>
          <div className="text-right">
            <div className="spec">deposit</div>
            <div className="tnum text-sm font-semibold">$4,613</div>
          </div>
        </div>
        <div className="spec">or from $128/mo · financing available</div>
        <button className="btn btn-primary w-full">Accept &amp; e-sign</button>
      </div>
    </div>
  );
}

/* ───────────────────────── product-row spine ───────────────────────── */
function Row({
  label,
  title,
  body,
  points,
  reverse = false,
  frame,
}: {
  label: string;
  title: string;
  body: string;
  points: string[];
  reverse?: boolean;
  frame: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={reverse ? "lg:order-2" : ""}>
        <div className="spec" style={{ color: "var(--brand)" }}>
          {label}
        </div>
        <h3 className="display mt-3 text-[clamp(1.7rem,3vw,2.4rem)]" style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          {title}
        </h3>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">{body}</p>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-3 text-[15px]">
              <Tick />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={120} className={reverse ? "lg:order-1" : ""}>
        {frame}
      </Reveal>
    </div>
  );
}

const TRADES = [
  "Roofing", "Siding", "Gutters", "Windows", "Remodels", "Electrical", "HVAC", "Plumbing",
  "Solar", "Painting", "Concrete", "Fencing", "Decking", "Insulation", "Drywall", "Flooring",
];

const FLOW: [string, string][] = [
  ["Measure", "Type the address. AI traces the roof from satellite; you confirm on site — you stay the pro."],
  ["Quote", "Good / Better / Best from your own rate card, in seconds. Real contractor-grade markup."],
  ["Propose", "A branded page your customer signs from their phone. Your logo, your color, no PDF wrangling."],
  ["Get paid", "Card deposit — or a monthly financing offer — the day they say yes. No 45-day check chase."],
];

const STATS: { value: React.ReactNode; label: string }[] = [
  { value: <CountUp to={60} suffix="s" />, label: "from address to a signed-ready quote" },
  { value: <CountUp to={16} />, label: "trades, one estimate engine" },
  { value: "$0", label: "to start — no contract, no per-seat" },
  { value: "Same-day", label: "card deposits in your bank" },
];

export default function Landing() {
  return (
    <div style={{ background: "var(--paper)" }}>
      <SiteNav />

      {/* ── HERO — dark, full-viewport, 7/5 split ── */}
      <section className="relative flex min-h-screen flex-col overflow-hidden" style={{ background: "var(--graphite-900)" }}>
        <div className="grid-blueprint-dark absolute inset-0 opacity-60" />
        <div
          className="pointer-events-none absolute -right-32 -top-40 h-[620px] w-[620px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(234,78,28,0.20), transparent 62%)" }}
        />
        <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center px-6 md:px-10">
          <div className="grid w-full items-center gap-12 pb-16 pt-32 lg:grid-cols-12 lg:pb-20 lg:pt-36">
            <div className="lg:col-span-7">
              <p className="spec" style={{ color: "var(--brand)" }}>
                The trades operating system
              </p>
              <h1
                className="display mt-5 text-white"
                style={{ fontSize: "clamp(2.7rem,6.4vw,5.1rem)", lineHeight: 0.97, letterSpacing: "-0.025em" }}
              >
                QUOTE IT FROM
                <br />
                THE TRUCK.
                <br />
                <span style={{ color: "var(--brand)" }}>GET PAID</span> BEFORE
                <br />
                YOU PACK UP.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/70">
                An address becomes a measured takeoff, a priced good/better/best proposal your customer signs
                on their phone, and a deposit in your bank — before you leave the driveway.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <Link href="/signup" className="btn btn-primary">
                  Start free
                </Link>
                <Link href="/api/dev/login-as-demo" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
                  See a 60-second quote →
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <HeroProposal />
            </div>
          </div>
        </div>

        {/* works-with wall pinned at the hero base (honest — no fabricated customer logos) */}
        <div className="relative border-t border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-7 md:px-10">
            <p className="spec text-center text-white/40">Your estimates already speak their language</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {["GAF", "James Hardie", "CertainTeed", "Andersen", "Trex", "Sherwin-Williams"].map((b) => (
                <span key={b} className="display text-base tracking-tight text-white/45">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── THESIS — dark statement ── */}
      <section style={{ background: "var(--graphite-800)" }} className="py-[clamp(5rem,10vw,9rem)]">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <Reveal>
            <p className="display text-white" style={{ fontSize: "clamp(1.7rem,3.4vw,2.9rem)", lineHeight: 1.12, letterSpacing: "-0.02em" }}>
              Most contractors lose the evening to estimating and 45 days to chasing the check.{" "}
              <span style={{ color: "var(--brand)" }}>Tradesmith collapses the whole job</span> into one tool
              that respects the trade — and runs even with zero setup.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── MEGA-TYPE MOMENT — dark, textured, boxed word ── */}
      <section className="relative overflow-hidden" style={{ background: "var(--graphite-900)" }}>
        <div className="grid-blueprint-dark absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-[clamp(6rem,13vw,11rem)] md:px-10">
          <Reveal>
            <h2
              className="display text-center text-white"
              style={{ fontSize: "clamp(2.6rem,10.5vw,8.5rem)", lineHeight: 0.92, letterSpacing: "-0.035em" }}
            >
              FROM THE DRIVEWAY
              <br />
              TO{" "}
              <span
                className="inline-block px-3"
                style={{ color: "var(--brand)", boxShadow: "inset 0 0 0 3px var(--brand)", borderRadius: 10 }}
              >
                DEPOSITED
              </span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-8 max-w-xl text-center text-white/55">
              No office trip. No retyping into Word. No waiting on a check. The job moves at the speed you do.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── WORKFLOW — light, one through-line (hairline ledger, not cards) ── */}
      <section id="flow" className="py-[clamp(5rem,11vw,10rem)]">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Reveal>
            <h2 className="display text-[clamp(1.9rem,4vw,3rem)]" style={{ letterSpacing: "-0.02em" }}>
              The whole job, one through-line.
            </h2>
          </Reveal>
          <div
            className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-hero)]"
            style={{ background: "var(--line)" }}
          >
            <div className="grid gap-px md:grid-cols-4" style={{ background: "var(--line)" }}>
              {FLOW.map(([verb, body], i) => (
                <Reveal key={verb} delay={i * 80} className="bg-[var(--surface)] p-7">
                  <div className="h-1 w-8 rounded-full" style={{ background: "var(--brand)" }} />
                  <h3 className="display mt-4 text-2xl" style={{ letterSpacing: "-0.01em" }}>
                    {verb}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS — light band, big numbers ── */}
      <section
        className="border-y py-[clamp(4rem,8vw,7rem)]"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="display tnum text-[clamp(3rem,6vw,5rem)] leading-none" style={{ color: "var(--ink)" }}>
                {s.value}
              </div>
              <div className="mt-3 max-w-[14rem] text-sm text-[var(--muted)]">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PRODUCT ROWS — the spine ── */}
      <section id="os" className="space-y-[clamp(5rem,10vw,8rem)] py-[clamp(5rem,11vw,9rem)]">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Reveal>
            <h2 className="display max-w-2xl text-[clamp(1.9rem,4vw,3rem)]" style={{ letterSpacing: "-0.02em" }}>
              One tool from the driveway to deposited.
            </h2>
          </Reveal>
        </div>

        <div className="mx-auto max-w-7xl space-y-[clamp(5rem,10vw,8rem)] px-6 md:px-10">
          <Row
            label="Forged for the trade"
            title="Your rate card. Your markup. Not a template."
            body="Every material and labor rate lives in an editable card — tuned to your suppliers and crews. Roofing is measured by AI from satellite; the math is a pure, offline engine that always works."
            points={[
              "AI satellite takeoff in under a minute",
              "Contractor-grade markup stack, fully visible",
              "Regional factors + per-trade overrides",
            ]}
            frame={
              <ProductFrame title="Rate card — Roofing">
                <div className="space-y-2">
                  {[
                    ["Architectural shingle", "$155 / sq"],
                    ["Tear-off labor", "$72 / sq"],
                    ["Install labor", "$285 / sq"],
                    ["Drip edge", "$2.40 / lf"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                    >
                      <span>{k}</span>
                      <span className="tnum font-semibold">{v}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <span className="spec">Regional factor</span>
                    <span className="tnum text-sm font-semibold" style={{ color: "var(--brand)" }}>
                      1.08×
                    </span>
                  </div>
                </div>
              </ProductFrame>
            }
          />

          <Row
            reverse
            label="Look like the pro"
            title="A proposal homeowners actually say yes to."
            body="White-labeled, premium, and interactive — the homeowner picks their own Good/Better/Best and sees the finish on their own house. A one-truck shop looks like the biggest name in town."
            points={[
              "Interactive tiers the homeowner self-upsells through",
              "Material swatches + AI 'after' visualization",
              "E-sign from the phone — no PDF",
            ]}
            frame={
              <ProductFrame title="Proposal — finish preview">
                <div className="space-y-3">
                  <div
                    className="grid-blueprint-dark flex h-24 items-end justify-between rounded-lg p-3"
                    style={{ background: "var(--graphite-700)" }}
                  >
                    <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold text-white" style={{ background: "rgba(20,24,28,.7)" }}>
                      AI visualization
                    </span>
                    <div className="flex gap-1.5">
                      {["#36393d", "#4b3f34", "#7d7f82"].map((c) => (
                        <span key={c} className="h-5 w-5 rounded-full border border-white/30" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <TierStrip />
                </div>
              </ProductFrame>
            }
          />

          <Row
            label="Get paid, not chased"
            title="The deposit's in the bank before you pack up."
            body="Accepting mints a deposit invoice the customer pays by card on the spot — or takes a monthly financing offer so price is never the 'no.'"
            points={[
              "Same-day card deposits via Stripe",
              "'Finance this roof' — monthly payment offers",
              "No more 45-day check chase",
            ]}
            frame={
              <ProductFrame title="Deposit — paid">
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="label">Deposit (35%)</div>
                      <div className="display tnum text-3xl leading-none" style={{ color: "var(--brand)" }}>
                        $4,613
                      </div>
                    </div>
                    <span className="badge" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>
                      ✓ Paid · card
                    </span>
                  </div>
                  <div className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                    Or finance: <span className="tnum font-semibold" style={{ color: "var(--trust)" }}>$128/mo</span>{" "}
                    <span className="text-[var(--muted)]">· 120 mo</span>
                  </div>
                </div>
              </ProductFrame>
            }
          />

          <Row
            reverse
            label="One screen, every trade"
            title="Sixteen trades. The same flow."
            body="Add a trade and it runs the identical measure → quote → propose → get-paid loop. Quote roofing, siding, gutters, and windows from one screen."
            points={["16 trades live today", "One editable engine, not 16 apps", "Add a trade in a config — not a rebuild"]}
            frame={
              <ProductFrame title="Trades">
                <div className="flex flex-wrap gap-2">
                  {TRADES.slice(0, 12).map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
                    >
                      {t}
                    </span>
                  ))}
                  <span className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: "var(--brand)" }}>
                    +4 more
                  </span>
                </div>
              </ProductFrame>
            }
          />
        </div>
      </section>

      {/* ── TRADES WALL — dark typographic wall ── */}
      <section id="trades" className="relative overflow-hidden py-[clamp(5rem,11vw,9rem)]" style={{ background: "var(--graphite-900)" }}>
        <div className="grid-blueprint-dark absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 md:px-10">
          <Reveal>
            <h2 className="display text-[clamp(1.9rem,4vw,3rem)] text-white" style={{ letterSpacing: "-0.02em" }}>
              One engine. <span style={{ color: "var(--brand)" }}>Sixteen trades.</span>
            </h2>
            <p className="mt-3 max-w-xl text-white/55">
              Roofing is measured by AI from satellite. The other fifteen quote from your rate card on the same screen.
            </p>
          </Reveal>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
            {TRADES.map((t, i) => (
              <Reveal key={t} delay={i * 25}>
                <span
                  className="display text-white/85 transition-colors hover:text-white"
                  style={{
                    fontSize: "clamp(1.4rem,3vw,2.5rem)",
                    letterSpacing: "-0.01em",
                    color: t === "Roofing" ? "var(--brand)" : undefined,
                  }}
                >
                  {t}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF MASONRY — light, asymmetric, honest (no fabricated testimonials) ── */}
      <section className="py-[clamp(5rem,11vw,9rem)]">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Reveal>
            <h2 className="display max-w-2xl text-[clamp(1.9rem,4vw,3rem)]" style={{ letterSpacing: "-0.02em" }}>
              Why crews are switching.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {/* big graphite claim */}
            <Reveal className="md:col-span-2">
              <div className="flex h-full flex-col justify-between rounded-[var(--radius-hero)] p-8 text-white" style={{ background: "var(--graphite-900)" }}>
                <p className="display text-[clamp(1.4rem,2.6vw,2rem)]" style={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                  Built on a real construction engine that already understands buildings and code — not a CRM with an AI sticker.
                </p>
                <p className="spec mt-6 text-white/45">The accuracy moat</p>
              </div>
            </Reveal>
            {/* forge card */}
            <Reveal delay={80}>
              <div className="flex h-full flex-col justify-between rounded-[var(--radius-hero)] p-8" style={{ background: "var(--brand)" }}>
                <p className="display text-2xl text-white" style={{ lineHeight: 1.15 }}>
                  $0 to start. No contract. No demo gate.
                </p>
                <p className="mt-6 text-sm text-white/85">Per-business pricing — not a per-seat climb.</p>
              </div>
            </Reveal>
            {/* video / demo tile */}
            <Reveal delay={120}>
              <Link
                href="/api/dev/login-as-demo"
                className="group flex h-full flex-col justify-between rounded-[var(--radius-hero)] border p-8"
                style={{ background: "var(--surface)", borderColor: "var(--line)" }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105" style={{ background: "var(--ink)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <div>
                  <div className="font-semibold">See a 60-second quote</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">Open the live demo — no card, no signup.</div>
                </div>
              </Link>
            </Reveal>
            {/* white claim */}
            <Reveal delay={80} className="md:col-span-2">
              <div className="flex h-full items-center rounded-[var(--radius-hero)] border p-8" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
                <p className="display text-[clamp(1.3rem,2.4vw,1.9rem)]" style={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                  Your prices, your brand. Every rate is editable; every proposal is{" "}
                  <span style={{ color: "var(--brand)" }}>white-labeled to your shop.</span>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PRICING — dark, flat panels ── */}
      <section id="pricing" className="py-[clamp(5rem,11vw,9rem)] text-white" style={{ background: "var(--graphite-800)" }}>
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Reveal>
            <h2 className="display text-[clamp(1.9rem,4vw,3rem)]" style={{ letterSpacing: "-0.02em" }}>
              Priced like a tool, not a tax.
            </h2>
            <p className="mt-3 max-w-xl text-white/55">
              Free while we build with founding crews. Publish-everything pricing — no demo gate, no hidden implementation fee.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {([
              ["Solo", "$0", "1 user · 1–3 trucks", ["Full takeoff + estimate", "Branded proposals", "Card payments", "Pay only on transactions"], false],
              ["Crew", "$99", "per business / mo", ["Up to 10 users", "Everything in Solo", "Financing offers", "QuickBooks + priority support"], true],
              ["Shop", "$249", "per business / mo", ["Up to 25 users", "Multi-location", "Materials-float access", "Onboarding + API"], false],
            ] as [string, string, string, string[], boolean][]).map(([name, price, sub, feats, hot]) => (
              <Reveal key={name}>
                <div
                  className="flex h-full flex-col rounded-[var(--radius-hero)] p-7"
                  style={{
                    background: hot ? "var(--graphite-700)" : "transparent",
                    border: `1px solid ${hot ? "var(--brand)" : "rgba(255,255,255,0.14)"}`,
                  }}
                >
                  {hot && (
                    <div className="spec mb-3 inline-block w-fit rounded-full px-2 py-0.5 text-white" style={{ background: "var(--brand)" }}>
                      Most popular
                    </div>
                  )}
                  <div className="text-sm font-medium text-white/70">{name}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="display text-4xl">{price}</span>
                    <span className="text-sm text-white/50">{sub}</span>
                  </div>
                  <ul className="mt-6 space-y-2.5 text-sm text-white/75">
                    {feats.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <Tick />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`mt-7 ${hot ? "btn btn-primary" : "btn btn-ghost"} w-full`} style={hot ? undefined : { background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
                    Start free
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA — full-bleed band + inset form ── */}
      <section id="access" className="relative overflow-hidden">
        <div className="grid-blueprint absolute inset-0" />
        <div
          className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(234,78,28,0.16), transparent 62%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-[clamp(5rem,11vw,9rem)] md:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <h2 className="display text-[clamp(2.2rem,5vw,3.8rem)]" style={{ lineHeight: 0.98, letterSpacing: "-0.025em" }}>
                Forge your shop&apos;s <span style={{ color: "var(--brand)" }}>future.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg text-[var(--muted)]">
                Try the live demo as a sample roofing company — no card, no signup — then get early access and help shape it.
              </p>
              <Link href="/api/dev/login-as-demo" className="btn btn-dark mt-7">
                See the live demo →
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <WaitlistForm />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER — dark ── */}
      <footer className="text-white" style={{ background: "var(--graphite-900)" }}>
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: "var(--brand)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path d="M4 7h12.5c0 2.6-2 4-4.4 4l.7 2.4H15L13.2 18H9.8l1-4.6H8.4C6 13.4 4 11.6 4 9V7z" fill="#fff" />
                    <rect x="7.5" y="18.6" width="7" height="1.9" rx="0.6" fill="#fff" />
                  </svg>
                </span>
                <span className="display text-lg tracking-tight">TRADESMITH</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-white/50">Forged for the field. The operating system for the trades.</p>
            </div>
            <div>
              <div className="spec text-white/40">Product</div>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                <li><a href="#os" className="hover:text-white">How it works</a></li>
                <li><a href="#trades" className="hover:text-white">Trades</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <div className="spec text-white/40">Get started</div>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                <li><Link href="/api/dev/login-as-demo" className="hover:text-white">Live demo</Link></li>
                <li><a href="#access" className="hover:text-white">Early access</a></li>
              </ul>
            </div>
            <div>
              <div className="spec text-white/40">Company</div>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                <li><a href="#access" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
            <span>© 2026 Tradesmith — Forged for the field.</span>
            <span>Runs end-to-end with zero API keys (demo mode).</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
