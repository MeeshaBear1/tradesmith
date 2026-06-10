import type {
  EstimateTier,
  LineItem,
  MaterialRate,
  Measurement,
  RateCard,
  Tier,
} from "@/lib/takeoff/types";
import { applyMarkups } from "@/lib/pricing/markup";
import { deriveContext, type RoofContext } from "@/lib/roofing/geometry";

const TIER_ORDER: Tier[] = ["good", "better", "best"];

function quantityForRate(rate: MaterialRate, ctx: RoofContext): number {
  if (rate.perSquare) return Math.ceil(rate.perSquare * ctx.billedSquares);
  switch (rate.basis) {
    case "eaveRakeLf":
      return Math.round(ctx.eaveRakeLf);
    case "ridgeHipLf":
      return Math.round(ctx.ridgeHipLf);
    case "dripEdgeLf":
      return Math.round(ctx.dripEdgeLf);
    case "ridgeLf":
      return Math.round(ctx.ridgeLf);
    case "penetrationCount":
      return ctx.penetrationCount;
    default:
      return Math.ceil(ctx.billedSquares);
  }
}

function iceWaterLf(scope: "eaves" | "eaves_valleys" | "full", ctx: RoofContext): number {
  if (scope === "eaves") return Math.round(ctx.eaveLf);
  if (scope === "eaves_valleys") return Math.round(ctx.eaveLf + ctx.valleyLf);
  // Full-deck: a membrane roll covers ~1.5 ft width => LF ≈ area / 1.5.
  return Math.round(ctx.adjustedSqft / 1.5);
}

function material(
  key: string,
  rate: MaterialRate,
  quantity: number,
): LineItem {
  return {
    key,
    category: "material",
    description: rate.desc,
    quantity,
    unit: rate.unit,
    unitCostCents: rate.costCents,
    lineCostCents: Math.round(quantity * rate.costCents),
  };
}

function buildTier(tier: Tier, ctx: RoofContext, rateCard: RateCard): EstimateTier {
  const profile = rateCard.tiers[tier];
  const M = rateCard.materials;
  const items: LineItem[] = [];

  // --- Materials ---
  const shingle = M[profile.shingle];
  items.push(material(profile.shingle, shingle, quantityForRate(shingle, ctx)));

  const underlayment = M[profile.underlayment];
  items.push(material(profile.underlayment, underlayment, quantityForRate(underlayment, ctx)));

  for (const key of ["starter_strip", "drip_edge", "ridge_cap", "roofing_nails", "pipe_boots"]) {
    const rate = M[key];
    items.push(material(key, rate, quantityForRate(rate, ctx)));
  }

  items.push(material("ice_water", M.ice_water, iceWaterLf(profile.iceWaterScope, ctx)));

  if (profile.ridgeVent) {
    items.push(material("ridge_vent", M.ridge_vent, quantityForRate(M.ridge_vent, ctx)));
  }

  // --- Labor ---
  const tearoff = rateCard.teardown.tearoff_labor;
  const tearoffUnitCents = Math.round(
    tearoff.costCents * (1 + tearoff.perLayerMultiplier * (ctx.existingLayers - 1)),
  );
  items.push({
    key: "tearoff_labor",
    category: "labor",
    description: `${tearoff.desc} (${ctx.existingLayers} layer${ctx.existingLayers > 1 ? "s" : ""})`,
    quantity: ctx.billedSquares,
    unit: "square",
    unitCostCents: tearoffUnitCents,
    lineCostCents: Math.round(ctx.billedSquares * tearoffUnitCents),
  });

  let installPerSq = rateCard.labor.installPerSquareCents[ctx.complexity];
  if (ctx.pitchX12 >= rateCard.labor.steepThresholdX12) installPerSq += rateCard.labor.steepPerSquareAddCents;
  if (ctx.stories >= 2) installPerSq += rateCard.labor.twoStoryAddPerSquareCents;
  items.push({
    key: "install_labor",
    category: "labor",
    description: `Installation labor (${ctx.complexity}${ctx.pitchX12 >= rateCard.labor.steepThresholdX12 ? ", steep" : ""}${ctx.stories >= 2 ? ", 2-story" : ""})`,
    quantity: ctx.billedSquares,
    unit: "square",
    unitCostCents: installPerSq,
    lineCostCents: Math.round(ctx.billedSquares * installPerSq),
  });

  // --- Disposal / equipment ---
  const dumpster = rateCard.teardown.dumpster;
  const dumpsterQty = Math.max(1, Math.ceil(ctx.billedSquares / dumpster.squaresPerDumpster));
  items.push({
    key: "dumpster",
    category: "equipment",
    description: dumpster.desc,
    quantity: dumpsterQty,
    unit: dumpster.unit,
    unitCostCents: dumpster.costCents,
    lineCostCents: dumpsterQty * dumpster.costCents,
  });

  const materialCents = sum(items, "material");
  const laborCents = sum(items, "labor");
  const disposalCents = sum(items, "equipment");
  const baseCents = materialCents + laborCents + disposalCents;

  const { totalCents, layers } = applyMarkups(baseCents, rateCard.markupStack, rateCard.regionalFactor);

  return {
    tier,
    label: profile.label,
    lineItems: items,
    displayQty: ctx.billedSquares,
    displayUnit: "squares",
    squares: ctx.billedSquares,
    materialCents,
    laborCents,
    disposalCents,
    feeCents: 0,
    baseCents,
    markup: layers,
    totalCents,
    pricePerSquareCents: Math.round(totalCents / ctx.billedSquares),
  };
}

function sum(items: LineItem[], category: LineItem["category"]): number {
  return items.filter((i) => i.category === category).reduce((s, i) => s + i.lineCostCents, 0);
}

/** Pure, offline good/better/best estimate. No external calls — always works. */
export function estimateRoofing(measurement: Measurement, rateCard: RateCard): EstimateTier[] {
  const ctx = deriveContext(measurement.detail, rateCard);
  return TIER_ORDER.map((tier) => buildTier(tier, ctx, rateCard));
}
