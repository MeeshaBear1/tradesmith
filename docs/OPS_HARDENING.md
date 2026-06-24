# Tradesmith — Tier 0 Ops Hardening

The short list that turns the demo into a **pilot** — safe for 10–50 hand-held
contractors. Most of this is now **built and fail-open**; the remaining items are
owner-only (they need dashboard access / account creation).

## What's built (this pass)

| Item | Status | Where |
|---|---|---|
| **Per-tenant rate + cost caps** on the paid AI endpoints (`/api/scope`, and ready for `/takeoff/measure`, `/render`) | ✅ Built, fail-open | `src/lib/ratelimit.ts` |
| **Transactional email** (signup welcome, proposal delivery, payment receipt) | ✅ Built, fail-open via Resend | `src/lib/email/send.ts` |
| **Error reporting** (structured logs always; Sentry POST when DSN set) | ✅ Built, no-op until DSN | `src/lib/observability.ts` |
| Webhook signature failures now surfaced (not console-only) | ✅ | `src/app/api/stripe/webhook/route.ts` |

All three degrade cleanly: with no `RESEND_API_KEY` emails are skipped, with no
`SENTRY_DSN` errors log to console, and the rate limiter fails open if it ever errors.
None of them can break the quoting/payment loop.

## Owner-only steps before a real tenant

### 1. Rotate the transcript-exposed secrets ⚠️ (do this first)
`SESSION_SECRET` and the Supabase **service-role key** were generated in an earlier
build session and are in the transcript. Rotate both before any real contractor:
- Supabase → Project Settings → API → roll the `service_role` key, update `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
- Generate a new `SESSION_SECRET` (e.g. `openssl rand -hex 32`) and set it in Vercel. (Prod already fails closed on the default value — see `env.ts`.)

### 2. Register the Stripe webhook
The handler is solid and idempotent; it just needs the endpoint wired:
- Stripe Dashboard → Developers → Webhooks → **Add endpoint** → `https://<your-domain>/api/stripe/webhook`
- Events: `payment_intent.succeeded`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET` (Vercel).

### 3. Turn on email (optional but recommended)
- Create a Resend account, verify your sending domain, create an API key.
- Set `RESEND_API_KEY` and `EMAIL_FROM` (a verified address) in Vercel.
- Until set, the app behaves exactly as before (no sends) — no code change needed.

### 4. Turn on error reporting (optional)
- Create a Sentry project, copy its DSN.
- Set `SENTRY_DSN` in Vercel. Errors then ship to Sentry in addition to logs.

## Rate-limit policy (tune in `src/lib/ratelimit.ts`)
Per contractor, in-process fixed window (best-effort across one instance):
- `scope`: 15/min, 150/day · `aiMeasure`: 20/min, 200/day · `render`: 10/min, 100/day

For multi-instance production, back the same `checkCostLimit()` interface with
Upstash/Vercel-KV — the call sites don't change.
