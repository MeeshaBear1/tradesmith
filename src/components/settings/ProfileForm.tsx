"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  name: string;
  phone: string | null;
  email: string | null;
  licenseNo: string | null;
  brandColor: string;
  logoUrl: string | null;
};

export function ProfileForm({ contractor }: { contractor: Profile }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: contractor.name,
    email: contractor.email ?? "",
    phone: contractor.phone ?? "",
    licenseNo: contractor.licenseNo ?? "",
    brandColor: contractor.brandColor,
    logoUrl: contractor.logoUrl ?? "",
  });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setState("idle");
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    if (res.ok) {
      setState("done");
      router.refresh();
    } else {
      setState("error");
    }
  }

  return (
    <form onSubmit={save} className="card p-5">
      <div className="label mb-3">Company profile</div>

      {/* Brand preview — how the proposal header will look */}
      <div className="mb-4 flex items-center gap-3 rounded-lg p-3" style={{ background: "var(--surface-sunken)" }}>
        {f.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.logoUrl} alt="logo" className="h-9 w-9 rounded-lg object-cover" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: f.brandColor }}>
            {(f.name || "T").slice(0, 1)}
          </span>
        )}
        <div>
          <div className="font-semibold">{f.name || "Your company"}</div>
          <div className="spec">{f.licenseNo || "License #"} · {f.phone || "phone"}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <L label="Company name"><input className="input" required value={f.name} onChange={set("name")} /></L>
        <L label="Email"><input className="input" type="email" value={f.email} onChange={set("email")} /></L>
        <L label="Phone"><input className="input" value={f.phone} onChange={set("phone")} /></L>
        <L label="License #"><input className="input" value={f.licenseNo} onChange={set("licenseNo")} /></L>
        <L label="Brand color">
          <div className="flex items-center gap-2">
            <input type="color" className="h-9 w-12 rounded border border-[var(--line)]" value={f.brandColor} onChange={set("brandColor")} />
            <span className="spec">{f.brandColor}</span>
          </div>
        </L>
        <L label="Logo URL (https)"><input className="input" placeholder="https://…/logo.png" value={f.logoUrl} onChange={set("logoUrl")} /></L>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button className="btn btn-primary" disabled={state === "busy"}>
          {state === "busy" ? "Saving…" : "Save profile"}
        </button>
        {state === "done" && <span className="text-sm" style={{ color: "var(--ok)" }}>Saved ✓</span>}
        {state === "error" && <span className="text-sm" style={{ color: "var(--danger)" }}>Couldn&apos;t save — try again.</span>}
      </div>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
