"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JobStatus } from "@/lib/db/types";

export interface JobListItem {
  id: string;
  name: string;
  address: string;
  status: JobStatus;
  icon: string;
  startDate: string | null;
  createdAt: string;
}

const STATUSES: (JobStatus | "all")[] = [
  "all",
  "new",
  "measured",
  "estimated",
  "proposed",
  "accepted",
  "invoiced",
  "paid",
];

/** Searchable, filterable jobs list — usable past a few dozen jobs (Tier 1 #1). */
export function JobList({ items }: { items: JobListItem[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (it) =>
        (status === "all" || it.status === status) &&
        (!needle ||
          it.name.toLowerCase().includes(needle) ||
          it.address.toLowerCase().includes(needle)),
    );
  }, [items, q, status]);

  return (
    <div>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          className="input flex-1"
          placeholder="Search name or address"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus | "all")}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      <div className="card mt-2 divide-y divide-[var(--line)]">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-[var(--muted)]">No matching jobs.</div>
        )}
        {filtered.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--paper)]"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">
                <span className="mr-1.5">{job.icon}</span>
                {job.name}
              </div>
              <div className="truncate text-sm text-[var(--muted)]">{job.address}</div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {job.startDate && (
                <span className="hidden text-xs text-[var(--muted)] sm:block">📅 {job.startDate}</span>
              )}
              <span
                className="badge capitalize"
                style={{ background: "var(--surface-sunken)", color: "var(--muted)" }}
              >
                {job.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
