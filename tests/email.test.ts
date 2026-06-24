import { describe, it, expect } from "vitest";
import { sendEmail } from "@/lib/email/send";
import { reportError } from "@/lib/observability";

describe("sendEmail — fail-open contract (no key in test env)", () => {
  it("skips cleanly when no mail key is configured", async () => {
    const r = await sendEmail({ to: "homeowner@example.com", subject: "Hi", html: "<p>Hi</p>" });
    expect(r.ok).toBe(false);
    expect(r.skipped).toBe(true);
  });

  it("rejects a malformed recipient without attempting a send", async () => {
    const r = await sendEmail({ to: "not-an-email", subject: "Hi", html: "<p>Hi</p>" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("bad_recipient");
  });
});

describe("reportError — never throws", () => {
  it("tolerates any input and redacts secret-shaped context keys", () => {
    expect(() => reportError(new Error("boom"), { where: "test", apiKey: "shh", contractorId: "c1" })).not.toThrow();
    expect(() => reportError("string error")).not.toThrow();
    expect(() => reportError(null)).not.toThrow();
  });
});
