# Tradesmith — Morning Go-Live

> **It's already live.** I deployed it overnight with a real database. Everything below is
> optional polish + how to show your friends. Live URL: **https://tradesmith-nu.vercel.app**

## TL;DR — what's working right now (no action needed)
- **Sign up a real shop** at `/signup` → your brand color + logo flow through every proposal.
- **Try the demo instantly** (no signup, pre-loaded pipeline): open
  **https://tradesmith-nu.vercel.app/api/dev/login-as-demo**
- Full loop works live on real Supabase: address → AI/manual takeoff → Good/Better/Best
  estimate → branded e-sign proposal → deposit invoice → pay (demo) → financing.
- Installable **mobile app (PWA)**, **pipeline board**, **dashboard metrics**, **materials
  list**, **in-person QR**, **drawn signature**, **proposal open-tracking**.

---

## Step 1 — (1 min) Unblock full-speed AI work: raise your Claude spend limit
The overnight parallel agents stopped on **"monthly spend limit"** — that's a *cap*, not your
$200 balance. Raise or remove it here: **claude.ai/settings/usage**. (Nothing else needs it;
the site is already up.)

## Step 2 — (3 min, optional) Light up the "wow" integrations
The app runs great without these (graceful fallback), but your keys make it shine. Paste your
own keys and redeploy:
```
cd C:\Users\nileh\Code\tradesmith
echo YOUR_ANTHROPIC_KEY        | vercel env add ANTHROPIC_API_KEY production
echo YOUR_MAPBOX_TOKEN         | vercel env add MAPBOX_TOKEN production
echo YOUR_STRIPE_TEST_SECRET   | vercel env add STRIPE_SECRET_KEY production
echo YOUR_STRIPE_TEST_PUBLISH  | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel --prod --yes
```
- **Anthropic** → real AI roof takeoff from satellite/photo + auto-written proposal scope.
- **Mapbox** → real satellite tile + geocoding in the measure step.
- **Stripe (test)** → real test-card deposit payments (card `4242 4242 4242 4242`).
- Stripe webhook is optional for the demo; the pay page also has a confirm path.

## Step 3 — (30 sec) Show your roofing friends
1. Open **https://tradesmith-nu.vercel.app** on a phone → browser menu → **Add to Home
   Screen**. It installs as a full-screen app with the Tradesmith icon.
2. Tap the home-screen icon → **Try the demo** link above → walk the dashboard, pipeline, and
   a proposal.
3. Or have them **sign up their own shop** and quote a job in ~60 seconds.

---

## What differentiates us (the demo talk-track)
- **Quote from the truck** — mobile-first PWA, snap the roof with the phone camera, price on
  the spot. Works on a roof with spotty signal (offline shell).
- **One link does it all** — branded proposal + e-sign (type *or* draw) + deposit + financing
  in a single homeowner link. Competitors split these across tools.
- **Know when they're warm** — proposal **open-tracking** tells you the moment a homeowner
  views it ("opened 2h ago — follow up").
- **In-person close** — show a **QR**; they scan and sign on their own phone in the driveway.
- **Business at a glance** — pipeline value, signed revenue, deposits in, close rate.
- **The crew's order list** — auto materials/supply list from the estimate, copy or print.
- **Any trade** — roofing measures from satellite; 15 other trades quote from a quick form,
  same proposal + payment flow.

## Native app (next step, not same-day)
See **NATIVE_APP.md**. The Capacitor shell wraps the live app: Android builds on Windows
(Android Studio); iOS needs a Mac. App-store binaries need paid dev accounts + review, so use
the installable PWA for tomorrow's demo.

## Housekeeping / security
- The Supabase **service-role key** and **SESSION_SECRET** were generated this session and
  appear in the transcript. To rotate later: Supabase dashboard → Project Settings → API
  (roll keys), then update `vercel env`. Not urgent for a friends demo.
- `/api/dev/login-as-demo` is a **public shared sandbox** by design (the "try it" button). It
  only ever grants the Apex demo tenant — never a real signup's data. Remove it before any
  real launch if you don't want a public demo door.
- Project locations: Vercel `nile-hs-projects/tradesmith`, Supabase project `tradesmith`
  (ref `yygwpvsssignkswkrhhg`). Re-run rich demo data anytime: `node scripts/seed-demo.mjs`.
