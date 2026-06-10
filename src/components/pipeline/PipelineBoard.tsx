"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JobStatus } from "@/lib/db/types";

const STAGES: { key: JobStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "measured", label: "Measured" },
  { key: "estimated", label: "Estimated" },
  { key: "proposed", label: "Proposed" },
  { key: "accepted", label: "Accepted" },
  { key: "invoiced", label: "Invoiced" },
  { key: "paid", label: "Paid" },
];
const ORDER = STAGES.map((s) => s.key);

interface BoardJob {
  id: string;
  homeownerName: string;
  address: string;
  vertical: string;
  status: JobStatus;
  createdAt: string;
}

export function PipelineBoard({ jobs }: { jobs: BoardJob[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function move(job: BoardJob, dir: -1 | 1) {
    const next = ORDER[ORDER.indexOf(job.status) + dir];
    if (!next) return;
    setBusy(job.id);
    try {
      await fetch(`/api/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const col = jobs.filter((j) => j.status === stage.key);
        return (
          <div key={stage.key} className="flex min-w-[80vw] flex-col sm:min-w-[252px]">
            <div className="flex items-center justify-between rounded-t-lg border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2">
              <span className="label">{stage.label}</span>
              <span className="badge" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                {col.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-b-lg border border-t-0 border-[var(--line)] bg-[var(--paper)] p-2">
              {col.length === 0 && (
                <div className="px-2 py-6 text-center text-xs text-[var(--muted)]">—</div>
              )}
              {col.map((job) => {
                const idx = ORDER.indexOf(job.status);
                return (
                  <div key={job.id} className="card p-3">
                    <Link href={`/jobs/${job.id}`} className="block">
                      <div className="truncate text-sm font-semibold">{job.homeownerName}</div>
                      <div className="truncate text-xs text-[var(--muted)]">{job.address}</div>
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        className="btn btn-ghost px-2 py-1 text-xs"
                        disabled={idx === 0 || busy === job.id}
                        onClick={() => move(job, -1)}
                        aria-label="Move to previous stage"
                      >
                        ←
                      </button>
                      <span className="spec">{job.vertical}</span>
                      <button
                        className="btn btn-ghost px-2 py-1 text-xs"
                        disabled={idx === ORDER.length - 1 || busy === job.id}
                        onClick={() => move(job, 1)}
                        aria-label="Move to next stage"
                      >
                        →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
