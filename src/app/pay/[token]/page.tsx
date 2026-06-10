import { notFound } from "next/navigation";
import { getStore } from "@/lib/db/store";
import { PayPanel } from "@/components/pay/PayPanel";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const store = await getStore();
  const invoice = await store.getInvoiceByToken(token);
  if (!invoice) notFound();

  const [job, contractor] = await Promise.all([
    store.getJob(invoice.jobId),
    store.getContractor(invoice.contractorId),
  ]);
  if (!job || !contractor) notFound();

  return (
    <div
      className="min-h-screen bg-[var(--paper)]"
      style={
        {
          ["--brand" as string]: contractor.brandColor,
          ["--brand-soft" as string]: `color-mix(in srgb, ${contractor.brandColor} 12%, white)`,
          ["--brand-strong" as string]: `color-mix(in srgb, ${contractor.brandColor} 82%, black)`,
        } as React.CSSProperties
      }
    >
      <header className="px-6 py-5 text-white" style={{ background: "var(--ink)" }}>
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {contractor.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={contractor.logoUrl} alt={contractor.name} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
              style={{ background: "var(--brand)" }}
            >
              {contractor.name.slice(0, 1)}
            </div>
          )}
          <div>
            <div className="font-semibold">{contractor.name}</div>
            <div className="text-xs text-stone-400">Deposit invoice · {job.homeownerName}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Secure your roof replacement</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{job.address}</p>
        <div className="mt-6">
          <PayPanel
            invoiceToken={invoice.publicToken}
            depositCents={invoice.depositCents}
            totalCents={invoice.amountCents}
            alreadyPaid={invoice.status === "paid"}
          />
        </div>
      </main>
    </div>
  );
}
