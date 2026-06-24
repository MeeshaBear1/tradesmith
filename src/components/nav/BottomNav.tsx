"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Native-style bottom tab bar (mobile only). The center "New" tab is raised + accented. */
export function BottomNav() {
  const pathname = usePathname();
  const is = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
        <Tab href="/today" label="Today" active={is("/today")}>
          <path d="M4 5h16v15H4zM4 9h16M8 3v4M16 3v4" />
        </Tab>
        <Tab href="/dashboard" label="Jobs" active={is("/dashboard")}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </Tab>
        <NewTab active={pathname.startsWith("/today/quote") || pathname.startsWith("/jobs/new")} />
        <Tab href="/pipeline" label="Pipeline" active={is("/pipeline")}>
          <path d="M4 5v14M10 5v9M16 5v14M22 5v9" />
        </Tab>
        <Tab href="/settings" label="Settings" active={is("/settings")}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </Tab>
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-2 text-[10px] font-semibold"
      style={{ color: active ? "var(--brand)" : "var(--muted)" }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
      {label}
    </Link>
  );
}

function NewTab({ active }: { active: boolean }) {
  return (
    <Link href="/today/quote" className="flex flex-col items-center gap-1 py-1.5" aria-label="Quote a job from a photo">
      <span
        className="flex h-11 w-11 -translate-y-2 items-center justify-center rounded-full text-white shadow-lg"
        style={{ background: "var(--brand)", outline: active ? "3px solid var(--brand-soft)" : "none" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="-mt-1 text-[10px] font-semibold" style={{ color: active ? "var(--brand)" : "var(--muted)" }}>
        New
      </span>
    </Link>
  );
}
