/** Turn a priced estimate tier into the crew's order/supply list. */
import type { EstimateTier, ItemCategory } from "@/lib/takeoff/types";

export interface SupplyGroup {
  heading: string;
  items: { description: string; quantity: number; unit: string }[];
}

const HEADINGS: Record<ItemCategory, string> = {
  material: "Materials",
  equipment: "Equipment & disposal",
  labor: "Labor",
  fee: "Fees",
};
const ORDER: ItemCategory[] = ["material", "equipment", "labor", "fee"];
const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildSupplyList(tier: EstimateTier): SupplyGroup[] {
  return ORDER.map((cat) => ({
    heading: HEADINGS[cat],
    items: tier.lineItems
      .filter((li) => li.category === cat)
      .map((li) => ({ description: li.description, quantity: round2(li.quantity), unit: li.unit })),
  })).filter((g) => g.items.length > 0);
}

/** Plain-text version for copy / SMS. */
export function supplyListText(tier: EstimateTier): string {
  return buildSupplyList(tier)
    .map(
      (g) =>
        `${g.heading.toUpperCase()}\n` +
        g.items.map((i) => `- ${i.quantity} ${i.unit} ${i.description}`).join("\n"),
    )
    .join("\n\n");
}
