import { requireContractor } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(0, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function InboxPage() {
  await requireContractor();
  const store = await getStore();
  const items = await store.listFeedback();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Feedback inbox</h1>
      <p className="text-sm text-[var(--muted)]">
        Early-access requests and feedback from the public site ({items.length}).
      </p>

      <div className="card mt-6 divide-y divide-[var(--line)]">
        {items.length === 0 && (
          <div className="p-10 text-center text-sm text-[var(--muted)]">
            No submissions yet. Share the home page and they&apos;ll land here.
          </div>
        )}
        {items.map((f) => (
          <div key={f.id} className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">
                  {f.name}{" "}
                  {f.company && <span className="text-[var(--muted)]">· {f.company}</span>}
                </div>
                <a href={`mailto:${f.email}`} className="text-sm text-[var(--brand)] hover:underline">
                  {f.email}
                </a>
                {f.role && <span className="ml-2 text-xs text-[var(--muted)]">{f.role}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                  {f.kind}
                </span>
                <span className="text-xs text-[var(--muted)]">{timeAgo(f.createdAt)}</span>
              </div>
            </div>
            {f.message && <p className="mt-2 text-sm text-[var(--muted)]">“{f.message}”</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
