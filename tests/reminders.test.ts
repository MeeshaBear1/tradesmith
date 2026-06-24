import { describe, it, expect } from "vitest";
import { followupsFor, daysSince } from "@/lib/reminders";
import type { Proposal, ProposalStatus } from "@/lib/db/types";

const T = Date.parse("2026-06-24T00:00:00Z");
const daysAgo = (n: number) => new Date(T - n * 86_400_000).toISOString();

function prop(over: Partial<Proposal>): Proposal {
  return {
    id: "p", jobId: "j", contractorId: "c", estimateId: "e", publicToken: "tok",
    status: "sent" as ProposalStatus, scopeCopy: null, signatureName: null, acceptedAt: null,
    viewedAt: null, createdAt: daysAgo(0), signatureDataUrl: null,
    ...over,
  };
}

describe("daysSince", () => {
  it("counts whole days, never negative", () => {
    expect(daysSince(daysAgo(5), T)).toBe(5);
    expect(daysSince(daysAgo(0), T)).toBe(0);
    expect(daysSince(new Date(T + 86_400_000).toISOString(), T)).toBe(0);
  });
});

describe("followupsFor — stale proposal nudges", () => {
  it("flags a sent-but-unopened proposal past the threshold", () => {
    const f = followupsFor([prop({ id: "a", status: "sent", createdAt: daysAgo(4) })], T);
    expect(f).toHaveLength(1);
    expect(f[0].reason).toBe("unopened");
    expect(f[0].ageDays).toBe(4);
  });

  it("flags a viewed-but-unsigned proposal past the threshold", () => {
    const f = followupsFor([prop({ id: "b", status: "viewed", viewedAt: daysAgo(3), createdAt: daysAgo(5) })], T);
    expect(f).toHaveLength(1);
    expect(f[0].reason).toBe("viewed_no_action");
  });

  it("ignores fresh, accepted, and declined proposals", () => {
    const f = followupsFor(
      [
        prop({ id: "fresh", status: "sent", createdAt: daysAgo(1) }),
        prop({ id: "won", status: "accepted", createdAt: daysAgo(9) }),
        prop({ id: "lost", status: "declined", createdAt: daysAgo(9) }),
        prop({ id: "justviewed", status: "viewed", viewedAt: daysAgo(1) }),
      ],
      T,
    );
    expect(f).toHaveLength(0);
  });

  it("sorts most-stale first", () => {
    const f = followupsFor(
      [
        prop({ id: "old", status: "sent", createdAt: daysAgo(10) }),
        prop({ id: "newer", status: "sent", createdAt: daysAgo(4) }),
      ],
      T,
    );
    expect(f.map((x) => x.proposalId)).toEqual(["old", "newer"]);
  });
});
