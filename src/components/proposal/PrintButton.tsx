"use client";

/** Browser print-to-PDF. Dependency-free; the print stylesheet cleans up the page. */
export function PrintButton({ label = "Save as PDF", className = "" }: { label?: string; className?: string }) {
  return (
    <button type="button" className={`btn btn-ghost text-sm no-print ${className}`} onClick={() => window.print()}>
      {label}
    </button>
  );
}
