# Deploying Tradesmith

The app is **deploy-ready** and runs end-to-end with **zero API keys** (demo mode), so you can ship a
public preview first, then add keys to light up live AI measurement + real test-mode payments.

## 0. One-time: who does what

- **Only you can:** authenticate the Vercel CLI (`vercel login` — needs your email/browser) and supply
  the secret keys. Everything else is prepared.
- **Already done:** Next 16 production build is green (24 routes), `.env.example` lists every variable,
  `.gitignore` excludes secrets, RLS + signed sessions + Stripe webhook are in place.

## 1. Fastest path — public preview in demo mode (no keys)

```powershell
# from C:\Users\nileh\Code\tradesmith
vercel login            # your account (one time)
vercel --prod           # first run links/creates the project, then deploys
```
That gives you a live URL you can text to roofing friends today. The marketing site, the demo dashboard,
all 16 trades, proposals, and the waitlist/feedback inbox all work. Payments show the "mark paid (demo)"
button; roof measurement uses the manual/stub path.

> Note (from your ops history): `vercel --prod` does **not** alias a custom domain. If you attach one,
> also run `vercel alias set <deployment-url> tradesmith.app` (or your domain).

## 2. Light it up — add keys (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you want), then redeploy (`vercel --prod`):

| Variable | Where to get it | Lights up |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | console.anthropic.com | AI roof measurement + proposal scope copy |
| `MAPBOX_TOKEN` | account.mapbox.com | Satellite imagery + geocoding |
| `STRIPE_SECRET_KEY` (test) | dashboard.stripe.com (test mode) | Real test-mode card payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test) | same | Stripe Elements on the pay page |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` / dashboard webhook | Authoritative paid status |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase project | Persistent multi-session data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase project | " |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase project | Server-side data access + public pages |
| `SESSION_SECRET` | `openssl rand -base64 32` | Signs the session cookie (set a real value) |
| `NEXT_PUBLIC_APP_URL` | your deployed URL | Absolute links in proposals |
| `DEMO_MODE` | `0` in production | Turns off the demo-mode conveniences |

Without Supabase, the app uses an in-memory store (one shared dashboard, resets on redeploy) — fine for a
single-operator demo. Add Supabase when you want data to persist.

## 3. Supabase setup (when you add it)

1. Create a project at supabase.com.
2. Apply **all five migrations** in order, then the seed:

   **Option A — Supabase SQL editor (paste each file in order):**
   ```
   supabase/migrations/0001_init.sql            — core tables + RLS
   supabase/migrations/0002_takeoff_render.sql  — render columns + storage bucket
   supabase/migrations/0003_contractor_auth.sql — password_hash + email index
   supabase/migrations/0004_proposal_viewed.sql — proposal open-tracking (viewed_at)
   supabase/migrations/0005_demo_seed.sql       — demo tenant seed
   supabase/seed.sql                            — demo jobs + contractor data
   ```

   **Option B — Supabase CLI:**
   ```powershell
   supabase link --project-ref <ref>
   supabase db push   # applies all migrations in supabase/migrations/ in order
   # then paste supabase/seed.sql in the SQL editor
   ```

   > ⚠️ **All five migrations are required.** Applying only `0001` (as older docs stated)
   > will break proposal open-tracking, AI render, and contractor auth login at runtime.

3. Copy the URL + anon + service-role keys into Vercel env vars.

## 4. Stripe webhook (when you add Stripe)

Point a webhook at `https://<your-domain>/api/stripe/webhook` for the `payment_intent.succeeded` event,
and put its signing secret in `STRIPE_WEBHOOK_SECRET`. (Local testing: `stripe listen --forward-to
localhost:3100/api/stripe/webhook`.) Even without the webhook, the pay page confirms via the
server-verified `/api/stripe/confirm` route.

## 5. Verify after deploy

- Landing loads; "Try the demo" signs you in.
- New job → pick a trade → estimate → proposal link → accept → pay.
- With keys: enter a real address on a roofing job and confirm the satellite measurement renders.
- Settings → Rate card: change the regional factor, save, and confirm new estimates move.
