import Link from "next/link";
import { requireContractor } from "@/lib/auth/session";
import { integrationStatus } from "@/config/env";
import { IntegrationBadges } from "@/components/badges";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const contractor = await requireContractor();
  const status = integrationStatus();
  const initials = contractor.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      className="flex min-h-screen"
      style={{ ["--brand" as string]: contractor.brandColor } as React.CSSProperties}
    >
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[var(--ink)] px-4 py-6 text-stone-300 md:flex">
        <div>
          <Link href="/dashboard" className="flex items-center gap-3 px-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: "var(--brand)" }}
            >
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{contractor.name}</div>
              <div className="text-xs text-stone-400">{contractor.licenseNo}</div>
            </div>
          </Link>

          <nav className="mt-8 flex flex-col gap-1">
            <NavLink href="/today" label="Today" />
            <NavLink href="/dashboard" label="Jobs" />
            <NavLink href="/pipeline" label="Pipeline" />
            <NavLink href="/today/quote" label="Quote from a photo" accent />
            <NavLink href="/inbox" label="Feedback inbox" />
            <NavLink href="/settings" label="Settings" />
          </nav>
        </div>

        <div className="space-y-3 px-2 text-xs">
          <div className="text-stone-500 uppercase tracking-wide">Tradesmith</div>
          <Link href="/api/dev/logout" className="block text-stone-400 hover:text-white">
            Sign out
          </Link>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-6 py-3 md:hidden">
          <span className="font-semibold">{contractor.name}</span>
          <Link href="/jobs/new" className="btn btn-primary text-xs">
            New job
          </Link>
        </header>
        <main className="px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">{children}</main>
        <footer className="border-t border-[var(--line)] px-6 py-4 pb-24 md:pb-4">
          <IntegrationBadges status={status} />
        </footer>
      </div>

      <BottomNav />
    </div>
  );
}

function NavLink({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-white"
      style={accent ? { color: "#fff", background: "var(--brand)" } : undefined}
    >
      {label}
    </Link>
  );
}
