"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Tradesmith home">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md"
        style={{ background: "var(--brand)", boxShadow: "var(--shadow-forge)" }}
      >
        {/* Maker's mark — stamped anvil */}
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M4 7h12.5c0 2.6-2 4-4.4 4l.7 2.4H15L13.2 18H9.8l1-4.6H8.4C6 13.4 4 11.6 4 9V7z"
            fill="#fff"
          />
          <rect x="7.5" y="18.6" width="7" height="1.9" rx="0.6" fill="#fff" />
        </svg>
      </span>
      <span className="display text-[1.15rem] tracking-tight text-white">TRADESMITH</span>
    </Link>
  );
}

const LINKS = [
  { href: "#os", label: "Product" },
  { href: "#trades", label: "Trades" },
  { href: "#flow", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-[background,border-color] duration-200"
      style={{
        background: scrolled ? "rgba(21,24,28,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "transparent"}`,
      }}
    >
      <div
        className="mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-200 md:px-10"
        style={{ height: scrolled ? 60 : 78 }}
      >
        <Wordmark />
        <nav className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/65 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-white/65 transition-colors hover:text-white sm:block"
          >
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary text-sm">
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
