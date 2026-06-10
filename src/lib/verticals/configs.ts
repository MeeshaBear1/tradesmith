import type { Inputs, VerticalConfig } from "@/lib/verticals/types";
import { STANDARD_MARKUP, TIER_LABELS, n, tiered } from "@/lib/verticals/shared";

const base = {
  tierLabels: TIER_LABELS,
  markupStack: STANDARD_MARKUP,
  regionalFactor: 1.0,
};
const yn = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

/* ----------------------------- ROOFING (AI) ----------------------------- */
export const roofingConfig: VerticalConfig = {
  ...base,
  key: "roofing",
  label: "Roofing",
  icon: "🏠",
  blurb: "Re-roof from a satellite measurement.",
  unitLabel: "squares",
  measurementMode: "ai",
  primaryQuantityKey: "footprintSqft",
  fields: [
    { key: "footprintSqft", label: "Footprint", type: "number", unit: "sq ft", default: 2000, min: 100, max: 50000 },
    { key: "pitchX12", label: "Pitch", type: "number", unit: "x/12", default: 6, min: 0, max: 24 },
    {
      key: "complexity",
      label: "Complexity",
      type: "select",
      default: "moderate",
      options: [
        { value: "simple", label: "Simple" },
        { value: "moderate", label: "Moderate" },
        { value: "complex", label: "Complex" },
      ],
    },
    { key: "stories", label: "Stories", type: "number", default: 1, min: 1, max: 4 },
    { key: "existingLayers", label: "Existing layers", type: "number", default: 1, min: 1, max: 4 },
  ],
  lines: [],
  rates: {},
  scopeBlurb: (_i, t) =>
    `Complete tear-off and replacement of approximately ${t.squares} squares of roofing, installed to manufacturer and code specifications.`,
};

/* ------------------------------- SIDING -------------------------------- */
export const sidingConfig: VerticalConfig = {
  ...base,
  key: "siding",
  label: "Siding",
  icon: "🧱",
  blurb: "Re-side exterior walls.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "wallSqft",
  fields: [
    { key: "wallSqft", label: "Wall area", type: "number", unit: "sq ft", default: 1800, min: 100, max: 20000 },
    { key: "stories", label: "Stories", type: "number", default: 1, min: 1, max: 3 },
    { key: "openings", label: "Windows/doors to trim", type: "number", default: 8, min: 0, max: 60 },
    { key: "removeExisting", label: "Tear off existing?", type: "select", default: "yes", options: yn },
  ],
  lines: [
    { key: "siding", category: "material", unit: "sq ft", label: (_i, t) => (t === "good" ? "Vinyl siding" : t === "better" ? "Fiber-cement siding" : "Premium siding"), qty: (i) => n(i, "wallSqft") * 1.1 },
    { key: "housewrap", category: "material", unit: "sq ft", label: "House wrap", qty: (i) => n(i, "wallSqft") },
    { key: "trim", category: "material", unit: "opening", label: "Trim & flashing kit", qty: (i) => n(i, "openings") },
    { key: "fasteners", category: "material", unit: "sq", label: "Fasteners & sealant", qty: (i) => n(i, "wallSqft") / 100 },
    { key: "install", category: "labor", unit: "sq ft", label: "Installation labor", qty: (i) => n(i, "wallSqft") },
    { key: "twostory", category: "labor", unit: "sq ft", label: "2-story access", qty: (i) => (n(i, "stories") >= 2 ? n(i, "wallSqft") : 0) },
    { key: "tearoff", category: "labor", unit: "sq ft", label: "Tear-off existing siding", qty: (i) => (i.removeExisting === "yes" ? n(i, "wallSqft") : 0) },
    { key: "dumpster", category: "equipment", unit: "each", label: "Dumpster & haul-away", qty: (i) => Math.ceil(n(i, "wallSqft") / 1500) },
  ],
  rates: { siding: tiered(250, 500, 850), housewrap: 45, trim: tiered(2500, 3000, 4500), fasteners: 800, install: tiered(300, 380, 520), twostory: 80, tearoff: 120, dumpster: 47500 },
  scopeBlurb: (i, t) => `Re-side approximately ${Math.round(n(i, "wallSqft"))} sq ft of exterior wall with ${t.label.toLowerCase()}-grade material, including house wrap, trim, and flashing.`,
};

/* ------------------------------- GUTTERS ------------------------------- */
export const guttersConfig: VerticalConfig = {
  ...base,
  key: "gutters",
  label: "Gutters",
  icon: "🌧️",
  blurb: "Seamless gutters & downspouts.",
  unitLabel: "linear ft",
  measurementMode: "form",
  primaryQuantityKey: "gutterLf",
  fields: [
    { key: "gutterLf", label: "Gutter run", type: "number", unit: "linear ft", default: 160, min: 20, max: 2000 },
    { key: "downspouts", label: "Downspouts", type: "number", default: 5, min: 1, max: 40 },
    { key: "stories", label: "Stories", type: "number", default: 1, min: 1, max: 3 },
    { key: "guards", label: "Gutter guards?", type: "select", default: "no", options: yn },
    { key: "removeExisting", label: "Remove old gutters?", type: "select", default: "no", options: yn },
  ],
  lines: [
    { key: "gutter", category: "material", unit: "lf", label: (_i, t) => (t === "good" ? '5" aluminum K-style gutter' : t === "better" ? '6" aluminum gutter' : "Copper / half-round gutter"), qty: (i) => n(i, "gutterLf") },
    { key: "downspouts", category: "material", unit: "each", label: "Downspouts", qty: (i) => n(i, "downspouts") },
    { key: "hangers", category: "material", unit: "each", label: "Hidden hangers & sealant", qty: (i) => Math.ceil(n(i, "gutterLf") / 2) },
    { key: "guards", category: "material", unit: "lf", label: "Gutter guards", qty: (i) => (i.guards === "yes" ? n(i, "gutterLf") : 0) },
    { key: "install", category: "labor", unit: "lf", label: "Installation labor", qty: (i) => n(i, "gutterLf") },
    { key: "twostory", category: "labor", unit: "lf", label: "2-story access", qty: (i) => (n(i, "stories") >= 2 ? n(i, "gutterLf") : 0) },
    { key: "tearoff", category: "labor", unit: "lf", label: "Remove old gutters", qty: (i) => (i.removeExisting === "yes" ? n(i, "gutterLf") : 0) },
  ],
  rates: { gutter: tiered(350, 450, 1200), downspouts: tiered(3500, 4500, 9000), hangers: 150, guards: tiered(400, 600, 900), install: tiered(450, 550, 750), twostory: 120, tearoff: 120 },
  scopeBlurb: (i, t) => `Install ${Math.round(n(i, "gutterLf"))} ft of ${t.label.toLowerCase()}-grade seamless gutter with ${Math.round(n(i, "downspouts"))} downspouts${i.guards === "yes" ? " and leaf guards" : ""}.`,
};

/* ------------------------------- WINDOWS ------------------------------- */
export const windowsConfig: VerticalConfig = {
  ...base,
  key: "windows",
  label: "Windows",
  icon: "🪟",
  blurb: "Replacement windows installed.",
  unitLabel: "windows",
  measurementMode: "form",
  primaryQuantityKey: "windowCount",
  fields: [
    { key: "windowCount", label: "Number of windows", type: "number", default: 10, min: 1, max: 100 },
    { key: "removeExisting", label: "Remove existing?", type: "select", default: "yes", options: yn },
    { key: "trimWrap", label: "Exterior trim", type: "select", default: "aluminum", options: [{ value: "none", label: "None" }, { value: "aluminum", label: "Aluminum wrap" }] },
  ],
  lines: [
    { key: "unit", category: "material", unit: "each", label: (_i, t) => (t === "good" ? "Vinyl replacement window" : t === "better" ? "Premium vinyl window" : "Fiberglass / wood window"), qty: (i) => n(i, "windowCount") },
    { key: "flashing", category: "material", unit: "each", label: "Flashing, foam & fasteners", qty: (i) => n(i, "windowCount") },
    { key: "trimwrap", category: "material", unit: "each", label: "Aluminum trim wrap", qty: (i) => (i.trimWrap === "aluminum" ? n(i, "windowCount") : 0) },
    { key: "install", category: "labor", unit: "each", label: "Installation labor", qty: (i) => n(i, "windowCount") },
    { key: "removal", category: "labor", unit: "each", label: "Remove & dispose old window", qty: (i) => (i.removeExisting === "yes" ? n(i, "windowCount") : 0) },
    { key: "haul", category: "equipment", unit: "each", label: "Disposal", qty: (i) => Math.ceil(n(i, "windowCount") / 12) },
  ],
  rates: { unit: tiered(32000, 48000, 85000), flashing: 2500, trimwrap: 4500, install: tiered(12000, 14000, 20000), removal: 4000, haul: 20000 },
  scopeBlurb: (i, t) => `Supply and install ${Math.round(n(i, "windowCount"))} ${t.label.toLowerCase()}-grade replacement windows, fully flashed and sealed.`,
};

/* ------------------------------- REMODEL ------------------------------- */
const scopeMult = (i: Inputs): number => (i.scope === "refresh" ? 0.6 : i.scope === "gut" ? 1.6 : 1.0);
export const remodelConfig: VerticalConfig = {
  ...base,
  key: "remodel",
  label: "Remodel",
  icon: "🛠️",
  blurb: "Kitchen, bath, or room remodel.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "roomSqft",
  fields: [
    { key: "roomSqft", label: "Area", type: "number", unit: "sq ft", default: 200, min: 20, max: 5000 },
    { key: "rooms", label: "Rooms", type: "number", default: 1, min: 1, max: 20 },
    { key: "scope", label: "Scope", type: "select", default: "standard", options: [{ value: "refresh", label: "Refresh (cosmetic)" }, { value: "standard", label: "Standard" }, { value: "gut", label: "Gut renovation" }] },
  ],
  lines: [
    { key: "design", category: "fee", unit: "project", label: "Design, permits & management", qty: () => 1 },
    { key: "demo", category: "labor", unit: "sq ft", label: "Demolition & prep", qty: (i) => n(i, "roomSqft") * scopeMult(i) },
    { key: "materials", category: "material", unit: "sq ft", label: "Finishes & materials", qty: (i) => n(i, "roomSqft") * scopeMult(i) },
    { key: "fixtures", category: "material", unit: "room", label: "Fixtures & fittings", qty: (i) => n(i, "rooms") },
    { key: "trades", category: "labor", unit: "sq ft", label: "Trade labor (elec/plumb/finish)", qty: (i) => n(i, "roomSqft") * scopeMult(i) },
    { key: "dumpster", category: "equipment", unit: "each", label: "Dumpster & haul-away", qty: (i) => Math.ceil(n(i, "roomSqft") / 300) },
  ],
  rates: { design: tiered(150000, 250000, 400000), demo: 1500, materials: tiered(7000, 12000, 20000), fixtures: tiered(120000, 250000, 480000), trades: tiered(8000, 13000, 19000), dumpster: 60000 },
  scopeBlurb: (i, t) => `${t.label} ${String(i.scope)} remodel of approximately ${Math.round(n(i, "roomSqft"))} sq ft across ${Math.round(n(i, "rooms"))} room(s).`,
};

/* ------------------------------ ELECTRICAL ----------------------------- */
export const electricalConfig: VerticalConfig = {
  ...base,
  key: "electrical",
  label: "Electrical",
  icon: "⚡",
  blurb: "Devices, circuits & panel work.",
  unitLabel: "devices",
  measurementMode: "form",
  primaryQuantityKey: "devices",
  fields: [
    { key: "devices", label: "Outlets/switches/fixtures", type: "number", default: 20, min: 1, max: 400 },
    { key: "circuits", label: "New circuits", type: "number", default: 4, min: 0, max: 80 },
    { key: "panelUpgrade", label: "Panel upgrade", type: "select", default: "none", options: [{ value: "none", label: "None" }, { value: "200A", label: "200A service" }] },
  ],
  lines: [
    { key: "rough_material", category: "material", unit: "each", label: "Devices, wire & boxes", qty: (i) => n(i, "devices") },
    { key: "devices_labor", category: "labor", unit: "each", label: "Device install labor", qty: (i) => n(i, "devices") },
    { key: "circuits", category: "labor", unit: "each", label: "New dedicated circuits", qty: (i) => n(i, "circuits") },
    { key: "panel", category: "fee", unit: "each", label: "200A panel upgrade", qty: (i) => (i.panelUpgrade === "200A" ? 1 : 0) },
    { key: "permit", category: "fee", unit: "each", label: "Permit & inspection", qty: () => 1 },
  ],
  rates: { rough_material: tiered(1500, 2200, 3500), devices_labor: 8500, circuits: 18000, panel: tiered(220000, 260000, 320000), permit: 25000 },
  scopeBlurb: (i) => `Install/replace ${Math.round(n(i, "devices"))} devices and ${Math.round(n(i, "circuits"))} circuits${i.panelUpgrade === "200A" ? ", with a 200A panel upgrade" : ""}, to code with permit and inspection.`,
};

/* --------------------------------- HVAC -------------------------------- */
export const hvacConfig: VerticalConfig = {
  ...base,
  key: "hvac",
  label: "HVAC",
  icon: "❄️",
  blurb: "System replacement & ductwork.",
  unitLabel: "tons",
  measurementMode: "form",
  primaryQuantityKey: "tons",
  fields: [
    { key: "tons", label: "System size", type: "number", unit: "tons", default: 3, min: 1, max: 10, step: 0.5 },
    { key: "zones", label: "Zones", type: "number", default: 1, min: 1, max: 8 },
    { key: "ductwork", label: "Ductwork", type: "select", default: "keep", options: [{ value: "keep", label: "Reuse existing" }, { value: "replace", label: "Replace" }] },
  ],
  lines: [
    { key: "equipment", category: "material", unit: "ton", label: (_i, t) => `Condenser/heat source (${t === "good" ? "14 SEER" : t === "better" ? "16 SEER" : "high-efficiency"})`, qty: (i) => n(i, "tons") },
    { key: "airhandler", category: "material", unit: "each", label: "Air handler / furnace", qty: () => 1 },
    { key: "ductwork", category: "material", unit: "zone", label: "Ductwork replacement", qty: (i) => (i.ductwork === "replace" ? n(i, "zones") : 0) },
    { key: "install", category: "labor", unit: "ton", label: "Installation labor", qty: (i) => n(i, "tons") },
    { key: "misc", category: "material", unit: "each", label: "Lineset, pad & misc", qty: () => 1 },
    { key: "permit", category: "fee", unit: "each", label: "Permit & startup", qty: () => 1 },
  ],
  rates: { equipment: tiered(90000, 120000, 170000), airhandler: tiered(120000, 180000, 280000), ductwork: 80000, install: 60000, misc: 35000, permit: 30000 },
  scopeBlurb: (i, t) => `Supply and install a ${n(i, "tons")}-ton ${t.label.toLowerCase()}-efficiency HVAC system${i.ductwork === "replace" ? " with new ductwork" : ""}, including permit and startup.`,
};

/* ------------------------------- PLUMBING ------------------------------ */
export const plumbingConfig: VerticalConfig = {
  ...base,
  key: "plumbing",
  label: "Plumbing",
  icon: "🚰",
  blurb: "Fixtures, repipe & water heaters.",
  unitLabel: "fixtures",
  measurementMode: "form",
  primaryQuantityKey: "fixtures",
  fields: [
    { key: "fixtures", label: "Fixtures", type: "number", default: 8, min: 1, max: 80 },
    { key: "repipe", label: "Repipe?", type: "select", default: "no", options: yn },
    { key: "waterHeater", label: "Water heater", type: "select", default: "none", options: [{ value: "none", label: "None" }, { value: "tank", label: "Tank" }, { value: "tankless", label: "Tankless" }] },
  ],
  lines: [
    { key: "fixture_material", category: "material", unit: "each", label: "Fixtures & trim", qty: (i) => n(i, "fixtures") },
    { key: "fixture_labor", category: "labor", unit: "each", label: "Fixture set & connect", qty: (i) => n(i, "fixtures") },
    { key: "repipe", category: "labor", unit: "each", label: "Repipe (per fixture)", qty: (i) => (i.repipe === "yes" ? n(i, "fixtures") : 0) },
    { key: "wh_tank", category: "fee", unit: "each", label: "Tank water heater", qty: (i) => (i.waterHeater === "tank" ? 1 : 0) },
    { key: "wh_tankless", category: "fee", unit: "each", label: "Tankless water heater", qty: (i) => (i.waterHeater === "tankless" ? 1 : 0) },
    { key: "permit", category: "fee", unit: "each", label: "Permit & inspection", qty: () => 1 },
  ],
  rates: { fixture_material: tiered(8000, 15000, 28000), fixture_labor: 18000, repipe: 22000, wh_tank: 180000, wh_tankless: 380000, permit: 25000 },
  scopeBlurb: (i) => `Furnish and install ${Math.round(n(i, "fixtures"))} plumbing fixtures${i.repipe === "yes" ? ", repipe the supply lines" : ""}${i.waterHeater !== "none" ? `, and a ${String(i.waterHeater)} water heater` : ""}.`,
};

/* -------------------------------- SOLAR -------------------------------- */
export const solarConfig: VerticalConfig = {
  ...base,
  key: "solar",
  label: "Solar",
  icon: "☀️",
  blurb: "PV system, racking & battery.",
  unitLabel: "kW",
  measurementMode: "form",
  primaryQuantityKey: "systemKw",
  fields: [
    { key: "systemKw", label: "System size", type: "number", unit: "kW", default: 7, min: 1, max: 30, step: 0.5 },
    { key: "panels", label: "Panels", type: "number", default: 18, min: 4, max: 120 },
    { key: "batteryBackup", label: "Battery backup?", type: "select", default: "no", options: yn },
  ],
  lines: [
    { key: "panels_inverter", category: "material", unit: "kW", label: "Panels & inverter", qty: (i) => n(i, "systemKw") },
    { key: "racking", category: "material", unit: "panel", label: "Racking & hardware", qty: (i) => n(i, "panels") },
    { key: "install", category: "labor", unit: "kW", label: "Installation labor", qty: (i) => n(i, "systemKw") },
    { key: "electrical", category: "labor", unit: "each", label: "Electrical & interconnect", qty: () => 1 },
    { key: "battery", category: "fee", unit: "each", label: "Battery backup system", qty: (i) => (i.batteryBackup === "yes" ? 1 : 0) },
    { key: "permit", category: "fee", unit: "each", label: "Permit, engineering & inspection", qty: () => 1 },
  ],
  rates: { panels_inverter: tiered(120000, 150000, 210000), racking: 6000, install: 35000, electrical: 180000, battery: tiered(900000, 1200000, 1600000), permit: 60000 },
  scopeBlurb: (i) => `Design and install a ${n(i, "systemKw")} kW solar PV system (${Math.round(n(i, "panels"))} panels)${i.batteryBackup === "yes" ? " with battery backup" : ""}, including permitting and interconnection.`,
};

/* ------------------------------- PAINTING ------------------------------ */
export const paintingConfig: VerticalConfig = {
  ...base,
  key: "painting",
  label: "Painting",
  icon: "🎨",
  blurb: "Interior or exterior painting.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "paintSqft",
  fields: [
    { key: "paintSqft", label: "Paintable area", type: "number", unit: "sq ft", default: 2500, min: 100, max: 40000 },
    { key: "location", label: "Location", type: "select", default: "interior", options: [{ value: "interior", label: "Interior" }, { value: "exterior", label: "Exterior" }] },
    { key: "coats", label: "Coats", type: "select", default: "2", options: [{ value: "1", label: "1 coat" }, { value: "2", label: "2 coats" }] },
    { key: "prep", label: "Prep", type: "select", default: "light", options: [{ value: "light", label: "Light" }, { value: "heavy", label: "Heavy" }] },
  ],
  lines: [
    { key: "paint_material", category: "material", unit: "sq ft", label: (_i, t) => `${t === "good" ? "Standard" : t === "better" ? "Premium" : "Designer"} paint & primer`, qty: (i) => n(i, "paintSqft") },
    { key: "labor", category: "labor", unit: "sq ft", label: "Painting labor", qty: (i) => n(i, "paintSqft") },
    { key: "secondcoat", category: "labor", unit: "sq ft", label: "Second coat", qty: (i) => (i.coats === "2" ? n(i, "paintSqft") : 0) },
    { key: "prep", category: "labor", unit: "sq ft", label: "Heavy prep / repair", qty: (i) => (i.prep === "heavy" ? n(i, "paintSqft") : 0) },
    { key: "exterior", category: "labor", unit: "sq ft", label: "Exterior access & masking", qty: (i) => (i.location === "exterior" ? n(i, "paintSqft") : 0) },
    { key: "supplies", category: "material", unit: "sq", label: "Supplies & masking", qty: (i) => n(i, "paintSqft") / 100 },
  ],
  rates: { paint_material: tiered(35, 55, 90), labor: tiered(110, 140, 190), secondcoat: 45, prep: 60, exterior: 30, supplies: 600 },
  scopeBlurb: (i, t) => `${t.label}-grade ${String(i.location)} painting of approximately ${Math.round(n(i, "paintSqft"))} sq ft, ${i.coats} coat(s) with ${i.prep} prep.`,
};

/* ------------------------------- CONCRETE ------------------------------ */
export const concreteConfig: VerticalConfig = {
  ...base,
  key: "concrete",
  label: "Concrete",
  icon: "🧊",
  blurb: "Driveways, patios & flatwork.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "flatworkSqft",
  fields: [
    { key: "flatworkSqft", label: "Flatwork area", type: "number", unit: "sq ft", default: 600, min: 40, max: 20000 },
    { key: "thickness", label: "Thickness", type: "select", default: "4in", options: [{ value: "4in", label: '4"' }, { value: "6in", label: '6"' }] },
    { key: "finish", label: "Finish", type: "select", default: "broom", options: [{ value: "broom", label: "Broom" }, { value: "stamped", label: "Stamped" }] },
    { key: "tearout", label: "Tear out existing?", type: "select", default: "no", options: yn },
  ],
  lines: [
    { key: "concrete_material", category: "material", unit: "sq ft", label: "Concrete & gravel base", qty: (i) => n(i, "flatworkSqft") },
    { key: "rebar", category: "material", unit: "sq ft", label: "Rebar / wire mesh", qty: (i) => n(i, "flatworkSqft") },
    { key: "forming_labor", category: "labor", unit: "sq ft", label: "Forming, pour & finish", qty: (i) => n(i, "flatworkSqft") },
    { key: "finish_stamped", category: "labor", unit: "sq ft", label: "Stamped / decorative finish", qty: (i) => (i.finish === "stamped" ? n(i, "flatworkSqft") : 0) },
    { key: "thickness6", category: "material", unit: "sq ft", label: '6" thickness upgrade', qty: (i) => (i.thickness === "6in" ? n(i, "flatworkSqft") : 0) },
    { key: "tearout", category: "labor", unit: "sq ft", label: "Demo & haul existing", qty: (i) => (i.tearout === "yes" ? n(i, "flatworkSqft") : 0) },
    { key: "equipment", category: "equipment", unit: "each", label: "Pump / equipment", qty: (i) => Math.ceil(n(i, "flatworkSqft") / 800) },
  ],
  rates: { concrete_material: tiered(300, 350, 500), rebar: 90, forming_labor: 180, finish_stamped: 600, thickness6: 150, tearout: 250, equipment: 45000 },
  scopeBlurb: (i) => `Pour ${Math.round(n(i, "flatworkSqft"))} sq ft of ${String(i.thickness)} concrete flatwork with a ${String(i.finish)} finish.`,
};

/* -------------------------------- FENCING ------------------------------ */
export const fencingConfig: VerticalConfig = {
  ...base,
  key: "fencing",
  label: "Fencing",
  icon: "🚧",
  blurb: "Wood, vinyl or aluminum fence.",
  unitLabel: "linear ft",
  measurementMode: "form",
  primaryQuantityKey: "fenceLf",
  fields: [
    { key: "fenceLf", label: "Fence run", type: "number", unit: "linear ft", default: 150, min: 10, max: 5000 },
    { key: "height", label: "Height", type: "select", default: "6ft", options: [{ value: "4ft", label: "4 ft" }, { value: "6ft", label: "6 ft" }, { value: "8ft", label: "8 ft" }] },
    { key: "gates", label: "Gates", type: "number", default: 2, min: 0, max: 20 },
    { key: "removeExisting", label: "Remove existing?", type: "select", default: "no", options: yn },
  ],
  lines: [
    { key: "material", category: "material", unit: "lf", label: (_i, t) => (t === "good" ? "Wood fence material" : t === "better" ? "Vinyl fence material" : "Aluminum / ornamental"), qty: (i) => n(i, "fenceLf") },
    { key: "posts", category: "material", unit: "each", label: "Posts & concrete", qty: (i) => Math.ceil(n(i, "fenceLf") / 8) },
    { key: "install", category: "labor", unit: "lf", label: "Installation labor", qty: (i) => n(i, "fenceLf") },
    { key: "gates", category: "material", unit: "each", label: "Gates", qty: (i) => n(i, "gates") },
    { key: "height8", category: "labor", unit: "lf", label: "8 ft height upgrade", qty: (i) => (i.height === "8ft" ? n(i, "fenceLf") : 0) },
    { key: "demo", category: "labor", unit: "lf", label: "Remove old fence", qty: (i) => (i.removeExisting === "yes" ? n(i, "fenceLf") : 0) },
  ],
  rates: { material: tiered(1500, 2400, 3800), posts: 2500, install: 1200, gates: 18000, height8: 400, demo: 350 },
  scopeBlurb: (i, t) => `Install ${Math.round(n(i, "fenceLf"))} ft of ${String(i.height)} ${t.label.toLowerCase()}-grade fence with ${Math.round(n(i, "gates"))} gate(s).`,
};

/* -------------------------------- DECKING ------------------------------ */
export const deckingConfig: VerticalConfig = {
  ...base,
  key: "decking",
  label: "Decking",
  icon: "🪵",
  blurb: "Build or rebuild a deck.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "deckSqft",
  fields: [
    { key: "deckSqft", label: "Deck area", type: "number", unit: "sq ft", default: 300, min: 40, max: 5000 },
    { key: "railingLf", label: "Railing", type: "number", unit: "linear ft", default: 40, min: 0, max: 1000 },
    { key: "stairs", label: "Stairs?", type: "select", default: "yes", options: yn },
  ],
  lines: [
    { key: "decking", category: "material", unit: "sq ft", label: (_i, t) => (t === "good" ? "Pressure-treated decking" : t === "better" ? "Composite decking" : "Premium composite / hardwood"), qty: (i) => n(i, "deckSqft") },
    { key: "framing", category: "material", unit: "sq ft", label: "Framing lumber & hardware", qty: (i) => n(i, "deckSqft") },
    { key: "framing_labor", category: "labor", unit: "sq ft", label: "Framing & decking labor", qty: (i) => n(i, "deckSqft") },
    { key: "railing", category: "material", unit: "lf", label: "Railing (supply & install)", qty: (i) => n(i, "railingLf") },
    { key: "stairs", category: "fee", unit: "each", label: "Stairs", qty: (i) => (i.stairs === "yes" ? 1 : 0) },
    { key: "footings", category: "material", unit: "each", label: "Footings & posts", qty: (i) => Math.ceil(n(i, "deckSqft") / 40) },
  ],
  rates: { decking: tiered(700, 1200, 2000), framing: 600, framing_labor: 550, railing: tiered(4500, 7500, 12000), stairs: 180000, footings: 12000 },
  scopeBlurb: (i, t) => `Build a ${Math.round(n(i, "deckSqft"))} sq ft deck with ${t.label.toLowerCase()} decking and ${Math.round(n(i, "railingLf"))} ft of railing.`,
};

/* ------------------------------ INSULATION ----------------------------- */
export const insulationConfig: VerticalConfig = {
  ...base,
  key: "insulation",
  label: "Insulation",
  icon: "🧥",
  blurb: "Attic, wall & crawlspace insulation.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "insulationSqft",
  fields: [
    { key: "insulationSqft", label: "Area", type: "number", unit: "sq ft", default: 1200, min: 50, max: 20000 },
    { key: "removeOld", label: "Remove old insulation?", type: "select", default: "no", options: yn },
  ],
  lines: [
    { key: "material", category: "material", unit: "sq ft", label: (_i, t) => (t === "good" ? "Fiberglass batts" : t === "better" ? "Blown-in cellulose" : "Spray foam"), qty: (i) => n(i, "insulationSqft") },
    { key: "labor", category: "labor", unit: "sq ft", label: "Installation labor", qty: (i) => n(i, "insulationSqft") },
    { key: "airsealing", category: "labor", unit: "each", label: "Air sealing", qty: () => 1 },
    { key: "removal", category: "labor", unit: "sq ft", label: "Remove old insulation", qty: (i) => (i.removeOld === "yes" ? n(i, "insulationSqft") : 0) },
  ],
  rates: { material: tiered(60, 90, 180), labor: tiered(50, 65, 100), airsealing: 40000, removal: 90 },
  scopeBlurb: (i, t) => `Insulate ${Math.round(n(i, "insulationSqft"))} sq ft with ${t.label.toLowerCase()}-grade insulation, including air sealing.`,
};

/* ------------------------------- DRYWALL ------------------------------- */
export const drywallConfig: VerticalConfig = {
  ...base,
  key: "drywall",
  label: "Drywall",
  icon: "🧱",
  blurb: "Hang, tape & finish drywall.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "drywallSqft",
  fields: [
    { key: "drywallSqft", label: "Wall + ceiling area", type: "number", unit: "sq ft", default: 1500, min: 50, max: 30000 },
  ],
  lines: [
    { key: "material", category: "material", unit: "sheet", label: "Drywall sheets", qty: (i) => Math.ceil(n(i, "drywallSqft") / 32) },
    { key: "hang", category: "labor", unit: "sq ft", label: "Hang labor", qty: (i) => n(i, "drywallSqft") },
    { key: "finish", category: "labor", unit: "sq ft", label: (_i, t) => `Tape & finish (level ${t === "good" ? "3" : t === "better" ? "4" : "5"})`, qty: (i) => n(i, "drywallSqft") },
    { key: "supplies", category: "material", unit: "sq", label: "Mud, tape & fasteners", qty: (i) => n(i, "drywallSqft") / 100 },
  ],
  rates: { material: 1400, hang: 60, finish: tiered(90, 120, 160), supplies: 1200 },
  scopeBlurb: (i) => `Hang, tape and finish approximately ${Math.round(n(i, "drywallSqft"))} sq ft of drywall.`,
};

/* ------------------------------- FLOORING ------------------------------ */
export const flooringConfig: VerticalConfig = {
  ...base,
  key: "flooring",
  label: "Flooring",
  icon: "🪟",
  blurb: "LVP, hardwood or tile flooring.",
  unitLabel: "sq ft",
  measurementMode: "form",
  primaryQuantityKey: "floorSqft",
  fields: [
    { key: "floorSqft", label: "Floor area", type: "number", unit: "sq ft", default: 800, min: 30, max: 20000 },
    { key: "removeExisting", label: "Remove existing?", type: "select", default: "yes", options: yn },
  ],
  lines: [
    { key: "material", category: "material", unit: "sq ft", label: (_i, t) => (t === "good" ? "Luxury vinyl plank" : t === "better" ? "Engineered hardwood" : "Tile / premium hardwood"), qty: (i) => n(i, "floorSqft") * 1.08 },
    { key: "underlayment", category: "material", unit: "sq ft", label: "Underlayment & prep", qty: (i) => n(i, "floorSqft") },
    { key: "install", category: "labor", unit: "sq ft", label: "Installation labor", qty: (i) => n(i, "floorSqft") },
    { key: "removal", category: "labor", unit: "sq ft", label: "Remove existing floor", qty: (i) => (i.removeExisting === "yes" ? n(i, "floorSqft") : 0) },
    { key: "trim", category: "material", unit: "lf", label: "Trim & transitions", qty: (i) => n(i, "floorSqft") / 20 },
  ],
  rates: { material: tiered(300, 550, 950), underlayment: 60, install: tiered(280, 350, 480), removal: 150, trim: 800 },
  scopeBlurb: (i, t) => `Supply and install ${Math.round(n(i, "floorSqft"))} sq ft of ${t.label.toLowerCase()}-grade flooring.`,
};
