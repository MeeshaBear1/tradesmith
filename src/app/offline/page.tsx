/** Offline fallback served by the service worker when the network is unreachable. */
export const metadata = { title: "Offline — Tradesmith" };

export default function OfflinePage() {
  return (
    <div className="grid-blueprint-dark flex min-h-screen flex-col items-center justify-center bg-[var(--graphite-900)] px-6 text-center text-white">
      <div className="display text-2xl tracking-tight">
        TRADE<span style={{ color: "var(--brand)" }}>SMITH</span>
      </div>
      <h1 className="display mt-8 text-4xl font-extrabold tracking-tight">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm text-stone-400">
        No signal on the roof? No problem. Your jobs and proposals sync the moment you&apos;re back on
        a connection.
      </p>
      <a href="/dashboard" className="btn btn-primary mt-8">
        Try again
      </a>
    </div>
  );
}
