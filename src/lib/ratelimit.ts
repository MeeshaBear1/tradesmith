/**
 * Per-tenant rate + cost caps for the paid endpoints (AI measure, photo scope,
 * render). A contractor should never be able to run up the Anthropic / Mapbox /
 * Gemini bill for everyone else.
 *
 * This is an in-process fixed-window counter: best-effort across a single Node
 * instance, fail-open by design (a limiter bug must never take down quoting). For
 * multi-instance production, back it with Upstash/Vercel-KV behind the same
 * interface — the call sites don't change. (Same posture as Verdict's limiter.)
 */

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfterSec: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 50_000; // guard against unbounded growth

function prune(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
}

/** Named policies for the cost-bearing endpoints (per contractor). */
export const POLICIES = {
  // Bursty interactive use, but capped so one tenant can't hammer the model.
  aiMeasure: { perMin: { limit: 20, windowMs: 60_000 }, perDay: { limit: 200, windowMs: 86_400_000 } },
  scope: { perMin: { limit: 15, windowMs: 60_000 }, perDay: { limit: 150, windowMs: 86_400_000 } },
  render: { perMin: { limit: 10, windowMs: 60_000 }, perDay: { limit: 100, windowMs: 86_400_000 } },
} as const;

export function rateLimit(key: string, policy: RateLimitPolicy, now: number = Date.now()): RateLimitResult {
  prune(now);
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    const resetAt = now + policy.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: policy.limit - 1, limit: policy.limit, resetAt, retryAfterSec: 0 };
  }
  b.count += 1;
  const ok = b.count <= policy.limit;
  return {
    ok,
    remaining: Math.max(0, policy.limit - b.count),
    limit: policy.limit,
    resetAt: b.resetAt,
    retryAfterSec: ok ? 0 : Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
  };
}

/**
 * Compose a per-minute burst cap and a per-day cost cap for a named endpoint.
 * Returns the first failing window (so the response can surface the right retry).
 */
export function checkCostLimit(
  endpoint: keyof typeof POLICIES,
  contractorId: string,
  now: number = Date.now(),
): RateLimitResult {
  const p = POLICIES[endpoint];
  const min = rateLimit(`${endpoint}:min:${contractorId}`, p.perMin, now);
  if (!min.ok) return min;
  const day = rateLimit(`${endpoint}:day:${contractorId}`, p.perDay, now);
  return day;
}

/** Test/maintenance helper. */
export function __resetRateLimits() {
  buckets.clear();
}
