import Link from "next/link";
import { requireContractor } from "@/lib/auth/session";
import { getEngine } from "@/lib/takeoff/registry";
import { VERTICAL_LIST } from "@/lib/verticals/registry";
import { formatCents } from "@/lib/money";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default async function SettingsPage() {
  const contractor = await requireContractor();
  const rateCard = getEngine("roofing").defaultRateCard();
  const tradeCount = VERTICAL_LIST.length;
  const factor = contractor.rateConfig?.regionalFactor ?? 1;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="mt-6">
        <ProfileForm
          contractor={{
            name: contractor.name,
            phone: contractor.phone,
            email: contractor.email,
            licenseNo: contractor.licenseNo,
            brandColor: contractor.brandColor,
            logoUrl: contractor.logoUrl,
          }}
        />
      </div>

      <Link href="/settings/rates" className="card mt-4 flex items-center justify-between p-5 transition hover:border-[var(--brand)]">
        <div>
          <div className="font-semibold">Rate card &amp; pricing →</div>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Edit unit costs across {tradeCount} trades and set your regional factor (currently{" "}
            <span className="tabular-nums">{factor.toFixed(2)}×</span>).
          </p>
        </div>
      </Link>

      <div className="card mt-4 p-5">
        <div className="label mb-1">Roofing rate card · {rateCard.version}</div>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Seed defaults — tune to your suppliers. All numbers drive every estimate.
        </p>
        <div className="grid gap-1 text-sm sm:grid-cols-2">
          {Object.entries(rateCard.materials).map(([key, m]) => (
            <div key={key} className="flex justify-between border-b border-[var(--line)] py-1.5">
              <span className="text-[var(--muted)]">{m.desc}</span>
              <span className="tabular-nums">
                {formatCents(m.costCents, { exact: true })}/{m.unit}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="label mb-2">Markup stack (compounding)</div>
          <div className="flex flex-wrap gap-2">
            {rateCard.markupStack.map((m) => (
              <span key={m.key} className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                {m.label} {Math.round(m.rate * 100)}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
