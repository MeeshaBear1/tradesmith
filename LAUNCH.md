# Tradesmith — Full Production Launch

Live now: **https://tradesmith-nu.vercel.app** (Vercel `nile-hs-projects/tradesmith` + Supabase
`tradesmith`). It already works in graceful-degradation mode. This is how you make every feature
fully real.

---

## 1. The API keys you need (what each unlocks, where to get it)

| Key | Powers | Get it | Cost |
|-----|--------|--------|------|
| `ANTHROPIC_API_KEY` | AI roof tracing from the satellite image + auto-written proposal copy | **console.anthropic.com** → Settings → API Keys → Create Key (`sk-ant-…`) | Pay-as-you-go; ~a few cents per roof measure. **Separate from your Claude Code $200** — the app needs its own key + a few $ of credit on the console. |
| `MAPBOX_TOKEN` | The **satellite imagery + geocoding** (address → lat/lng → nadir roof tile) | **account.mapbox.com** → Tokens → copy the default public token (`pk.…`) | Free tier is plenty for a pilot (~50k static images + 100k geocodes/mo free). |
| `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Real card deposit payments | **dashboard.stripe.com** → Developers → API keys. Use **test** keys (`sk_test_`/`pk_test_`) for the pilot; **live** keys for real money. | Stripe fee per charge in live mode; test mode is free. |
| `STRIPE_WEBHOOK_SECRET` | Confirms payments server-side (marks invoices paid reliably) | Stripe → Developers → Webhooks → add endpoint `https://<domain>/api/stripe/webhook`, event `payment_intent.succeeded`, copy `whsec_…` | Free |
| `GEMINI_API_KEY` *(optional)* | "See your house with the new roof" AI render | **aistudio.google.com** → Get API key | ~$0.02–0.04/image |

Already set (do not touch): Supabase URL/anon/service-role, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`.

### About the "roofing satellite site"
The app uses **Mapbox Satellite** — that *is* the satellite integration, and it's already built.
Add the token and real AI measurement turns on automatically (no other provider required).

- **Accuracy reality:** one top-down (nadir) tile → footprint ≈ ±10–15% on clean roofs, price
  ≈ ±15–25%. It's positioned honestly in the UI as **"AI assist — confirm on-site,"** with a
  confidence band that forces a manual confirm on low confidence. Great as a free first-pass /
  lead qualifier; not EagleView-grade.
- **If you later want measurement-grade reports** (for actual material orders / insurance), these
  are the dedicated providers you'd integrate (each is a paid, per-report API and a future build):
  **EagleView**, **Hover**, **Nearmap**, **GAF QuickMeasure**, or **Google Solar API**. Not needed
  to launch — Mapbox + Claude is the working pipeline today.

---

## 2. Set the keys + redeploy (≈3 min)

In a terminal at `C:\Users\nileh\Code\tradesmith`, run each and paste the value when prompted
(choose **Production**):
```
vercel env add ANTHROPIC_API_KEY production
vercel env add MAPBOX_TOKEN production
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel --prod --yes
```
(Or paste the keys to Claude and it will set them + redeploy for you — the CLI is already authed.)

---

## 3. Verify it's fully working
1. Sign in → **New job** → type a **real address** → the measure step should now show a **real
   satellite tile + AI-traced measurement + confidence %** (instead of the manual stub).
2. Build the estimate → create proposal → open it → **Accept** → pay with Stripe test card
   `4242 4242 4242 4242`, any future date/CVC → status flips to **Paid**.
3. (If Gemini key set) the proposal shows an AI "after" render of the finished roof.

---

## 4. Payments: important scope note
The current checkout charges to **one Stripe account** (yours). That's correct for collecting
deposits to your own account or a single-operator pilot. For a true **multi-contractor
marketplace** where each contractor gets paid out, you need **Stripe Connect** (per-contractor
onboarding + KYC + destination charges) — that is **not built** (financing is mocked too). It's the
next fintech milestone, not a same-day toggle.

---

## 5. Production hardening (before a real public launch)
- **Rotate secrets** generated this session (they're in the transcript): Supabase service-role key
  + `SESSION_SECRET`. Supabase dashboard → Project Settings → API → roll keys, then update
  `vercel env`.
- **Demo door:** `/api/dev/login-as-demo` is a public shared sandbox (the "try it" button). Keep it
  for marketing, or delete the route for a closed launch.
- **Mapbox token:** restrict it by URL (Mapbox token settings → URL restrictions → your domain) so
  it can't be reused elsewhere.
- **Abuse/cost control:** the measure endpoint costs money per call (Mapbox + Claude). It already
  requires auth; add per-tenant quotas before opening signups widely.
- **Custom domain (optional):** Vercel → project → Settings → Domains → add yours + point DNS, then
  update `NEXT_PUBLIC_APP_URL` to it and `vercel --prod`.
- **Stripe live mode:** swap test keys for live keys + a live webhook when you're ready to take real
  money.

---

## 6. "Fully live" checklist
- [ ] Spend limit raised (claude.ai/settings/usage) — unblocks AI agent work, unrelated to the site
- [ ] `ANTHROPIC_API_KEY` set → real AI takeoff + scope copy
- [ ] `MAPBOX_TOKEN` set → real satellite imagery + geocoding
- [ ] Stripe keys + webhook set → real (test or live) payments
- [ ] Redeployed (`vercel --prod`) and verified with a real address + test card
- [ ] Secrets rotated, Mapbox token URL-restricted, demo door decision made
- [ ] (Optional) custom domain + `NEXT_PUBLIC_APP_URL` updated
- [ ] (Later) Stripe Connect for contractor payouts; real aerial-measurement provider if needed
