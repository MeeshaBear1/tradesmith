"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScheduleEditor({
  jobId,
  startDate,
  endDate,
}: {
  jobId: string;
  startDate: string | null;
  endDate: string | null;
}) {
  const router = useRouter();
  const [start, setStart] = useState(startDate ?? "");
  const [end, setEnd] = useState(endDate ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: start || null, endDate: end || null }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <label className="block">
        <span className="mb-1 block text-xs text-[var(--muted)]">Start</span>
        <input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-[var(--muted)]">End</span>
        <input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} />
      </label>
      <button className="btn btn-ghost" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save dates"}
      </button>
      {saved && (
        <span className="text-xs" style={{ color: "var(--ok)" }}>
          Saved
        </span>
      )}
    </div>
  );
}
