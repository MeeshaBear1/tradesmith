"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Email or passphrase is incorrect.");
      router.push("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--paper)" }}>
      <div className="w-full max-w-sm">
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
          <h1 className="display text-2xl">Sign in</h1>
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="label">Email</span>
              <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourshop.com" />
            </label>
            <label className="block">
              <span className="label">Passphrase</span>
              <input className="input mt-1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
          </div>
          {err && <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>{err}</p>}
          <button className="btn btn-primary mt-5 w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in →"}
          </button>
          <p className="mt-4 text-center text-sm text-[var(--muted)]">
            New here?{" "}
            <Link href="/signup" className="font-medium" style={{ color: "var(--brand)" }}>Set up your shop</Link>
            {" · "}
            <Link href="/api/dev/login-as-demo" className="font-medium">Try the demo</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
