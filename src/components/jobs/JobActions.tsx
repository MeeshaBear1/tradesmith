"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JobActions({
  jobId,
  companyName,
  homeownerName,
  homeownerEmail,
  address,
  proposalToken,
}: {
  jobId: string;
  companyName: string;
  homeownerName: string;
  homeownerEmail: string | null;
  address: string;
  proposalToken: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ homeownerName, homeownerEmail: homeownerEmail ?? "", address });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(f),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function remove() {
    if (!confirm("Delete this job and its estimate, proposal, and invoice? This can't be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
    else setBusy(false);
  }

  const proposalUrl = proposalToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${proposalToken}` : null;

  async function copyLink() {
    if (!proposalUrl) return;
    await navigator.clipboard.writeText(proposalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const mailto = proposalUrl
    ? `mailto:${homeownerEmail ?? ""}?subject=${encodeURIComponent(`Your proposal from ${companyName}`)}&body=${encodeURIComponent(
        `Hi ${homeownerName.split(" ")[0] || ""},\n\nHere's your proposal: ${proposalUrl}\n\nYou can review the options, pick a package, and e-sign right from that link.\n\nThanks,\n${companyName}`,
      )}`
    : null;

  if (editing) {
    return (
      <form onSubmit={save} className="card p-5">
        <div className="label mb-3">Edit job</div>
        <div className="grid gap-3">
          <label className="block">
            <span className="label">Homeowner</span>
            <input className="input mt-1" required value={f.homeownerName} onChange={set("homeownerName")} />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input className="input mt-1" type="email" value={f.homeownerEmail} onChange={set("homeownerEmail")} />
          </label>
          <label className="block">
            <span className="label">Address</span>
            <input className="input mt-1" required value={f.address} onChange={set("address")} />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn btn-ghost text-sm" onClick={() => setEditing(true)}>Edit details</button>
      {proposalUrl && (
        <>
          <button className="btn btn-ghost text-sm" onClick={copyLink}>{copied ? "Copied ✓" : "Copy proposal link"}</button>
          {mailto && <a className="btn btn-ghost text-sm" href={mailto}>Email homeowner</a>}
        </>
      )}
      <button className="btn btn-ghost text-sm" onClick={remove} disabled={busy} style={{ color: "var(--danger)" }}>
        Delete
      </button>
    </div>
  );
}
