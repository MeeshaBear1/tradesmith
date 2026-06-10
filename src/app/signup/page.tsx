"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ERRORS: Record<string, string> = {
  email_taken: "That email already has a shop. Try signing in.",
  weak_password: "Use a passphrase of at least 8 characters.",
  invalid_fields: "Check your company name and a valid email.",
};

export default function SignupPage() {
  const router = useRouter();
  const [f, setF] = useState({ company: "", email: "", password: "", phone: "", licenseNo: "", brandColor: "#ea4e1c" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(ERRORS[j.error ?? ""] ?? "Could not create your shop.");
      }
      router.push("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--paper)" }}>
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: "var(--brand)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M4 7h12.5c0 2.6-2 4-4.4 4l.7 2.4H15L13.2 18H9.8l1-4.6H8.4C6 13.4 4 11.6 4 9V7z" fill="#fff" />
              <rect x="7.5" y="18.6" width="7" height="1.9" rx="0.6" fill="#fff" />
            </svg>
          </span>
          <span className="display text-lg tracking-tight">TRADESMITH</span>
        </Link>
        <form onSubmit={submit} className="card card-hero p-7">
          <h1 className="display text-2xl">Set up your shop</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Your own account — proposals go out branded to you.</p>
          <div className="mt-5 space-y-3">
            <Field label="Company name" required>
              <input className="input" required placeholder="e.g. Cascade Roofing Co." value={f.company} onChange={set("company")} />
            </Field>
            <Field label="Email" required>
              <input className="input" type="email" required placeholder="you@yourshop.com" value={f.email} onChange={set("email")} />
            </Field>
            <Field label="Passphrase" required>
              <input className="input" type="password" required minLength={8} placeholder="At least 8 characters" value={f.password} onChange={set("password")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <input className="input" placeholder="(555) 555-0123" value={f.phone} onChange={set("phone")} />
              </Field>
              <Field label="License #">
                <input className="input" placeholder="CCB / state #" value={f.licenseNo} onChange={set("licenseNo")} />
              </Field>
            </div>
            <Field label="Brand color">
              <div className="flex items-center gap-3">
                <input type="color" className="h-10 w-14 rounded-lg border border-[var(--line)] bg-[var(--surface)]" value={f.brandColor} onChange={set("brandColor")} />
                <span className="spec">{f.brandColor}</span>
              </div>
            </Field>
          </div>
          {err && <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>{err}</p>}
          <button className="btn btn-primary mt-5 w-full" disabled={busy}>
            {busy ? "Creating…" : "Create my shop →"}
          </button>
          <p className="mt-4 text-center text-sm text-[var(--muted)]">
            Already have a shop?{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--brand)" }}>Sign in</Link>
            {" · "}
            <Link href="/api/dev/login-as-demo" className="font-medium">Try the demo</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {required && <span style={{ color: "var(--brand)" }}> *</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
