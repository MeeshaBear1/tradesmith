import Link from "next/link";
import { requireContractor } from "@/lib/auth/session";
import { QuickQuote } from "@/components/field/QuickQuote";

export default async function QuickQuotePage() {
  await requireContractor();
  return (
    <div className="mx-auto max-w-md">
      <Link href="/today" className="text-sm text-[var(--muted)] hover:underline">
        ← Today
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Quote a job</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Two details, then straight to the camera.</p>
      <div className="mt-5">
        <QuickQuote />
      </div>
    </div>
  );
}
