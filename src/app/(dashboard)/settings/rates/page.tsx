import { requireContractor } from "@/lib/auth/session";
import { VERTICAL_LIST } from "@/lib/verticals/registry";
import { defaultInputs } from "@/lib/verticals/engine";
import { RateCardEditor, type TradeMeta } from "@/components/settings/RateCardEditor";

export default async function RatesPage() {
  const contractor = await requireContractor();
  const overrides = contractor.rateConfig;

  const trades: TradeMeta[] = VERTICAL_LIST.filter((c) => c.measurementMode === "form").map((c) => {
    const di = defaultInputs(c);
    const rates = Object.keys(c.rates).map((rateKey) => {
      const line = c.lines.find((l) => (l.rateKey ?? l.key) === rateKey);
      const label = line
        ? typeof line.label === "function"
          ? line.label(di, "better")
          : line.label
        : rateKey;
      const seed = c.rates[rateKey];
      return {
        rateKey,
        label,
        unit: line?.unit ?? "",
        isTiered: typeof seed === "object",
        current: overrides?.rates?.[c.key]?.[rateKey] ?? seed,
      };
    });
    return { key: c.key, label: c.label, icon: c.icon, rates };
  });

  return <RateCardEditor trades={trades} regionalFactor={overrides?.regionalFactor ?? 1} />;
}
