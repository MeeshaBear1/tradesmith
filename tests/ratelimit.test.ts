import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, checkCostLimit, POLICIES, __resetRateLimits } from "@/lib/ratelimit";

beforeEach(() => __resetRateLimits());

describe("rateLimit — fixed window per key", () => {
  it("allows up to the limit, then blocks with a retry hint", () => {
    const t0 = 1_000_000;
    const policy = { limit: 3, windowMs: 60_000 };
    expect(rateLimit("k", policy, t0).ok).toBe(true);
    expect(rateLimit("k", policy, t0).ok).toBe(true);
    const third = rateLimit("k", policy, t0);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);
    const fourth = rateLimit("k", policy, t0);
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const policy = { limit: 1, windowMs: 1000 };
    expect(rateLimit("k", policy, 0).ok).toBe(true);
    expect(rateLimit("k", policy, 500).ok).toBe(false);
    expect(rateLimit("k", policy, 1000).ok).toBe(true); // new window
  });

  it("keys are independent (one tenant can't exhaust another)", () => {
    const policy = { limit: 1, windowMs: 60_000 };
    expect(rateLimit("a", policy, 0).ok).toBe(true);
    expect(rateLimit("a", policy, 0).ok).toBe(false);
    expect(rateLimit("b", policy, 0).ok).toBe(true); // unaffected
  });
});

describe("checkCostLimit — per-minute burst + per-day cost cap", () => {
  it("blocks once the per-minute burst is exceeded", () => {
    const perMin = POLICIES.scope.perMin.limit;
    let last = { ok: true } as ReturnType<typeof checkCostLimit>;
    for (let i = 0; i < perMin; i++) last = checkCostLimit("scope", "c1", 5_000);
    expect(last.ok).toBe(true);
    expect(checkCostLimit("scope", "c1", 5_000).ok).toBe(false);
  });

  it("a different contractor is unaffected by the first one's usage", () => {
    for (let i = 0; i < POLICIES.scope.perMin.limit + 5; i++) checkCostLimit("scope", "c1", 5_000);
    expect(checkCostLimit("scope", "c2", 5_000).ok).toBe(true);
  });
});
