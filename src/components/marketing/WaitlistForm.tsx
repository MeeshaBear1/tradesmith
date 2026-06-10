"use client";

import { useState } from "react";

const ROLES = ["Owner / GM", "Estimator", "Project manager", "Sales", "Office / admin", "Other"];

export function WaitlistForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", message: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "waitlist", ...form }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="card card-hero p-8 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={{ background: "var(--brand)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="mt-3 text-xl font-bold">You&apos;re on the list.</h3>
        <p className="mt-1 text-[var(--muted)]">
          Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""} — we&apos;ll reach out personally. If
          you&apos;re a roofer, expect a real conversation, not a drip campaign.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <h3 className="text-xl font-bold">Get early access — and shape it</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        We&apos;re building this with roofers, not for them. Tell us what would actually save you time.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          required
          className="input"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          type="email"
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="input"
          placeholder="Company (optional)"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
        />
        <select
          className="input"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="">Your role…</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <textarea
          className="input sm:col-span-2"
          rows={3}
          placeholder="What's the most painful part of your estimate-to-invoice process today?"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>
      <button className="btn btn-primary mt-5 w-full" disabled={state === "busy"}>
        {state === "busy" ? "Sending…" : "Request early access →"}
      </button>
      {state === "error" && (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          Something went wrong — please try again.
        </p>
      )}
      <p className="mt-3 text-center text-xs text-[var(--muted)]">No spam. We&apos;ll only email you about Tradesmith.</p>
    </form>
  );
}
