import type { Contractor } from "@/lib/db/types";

/** Stable IDs so the demo-login bypass and the Supabase seed agree. */
export const DEMO_CONTRACTOR_ID = "11111111-1111-1111-1111-111111111111";

export const DEMO_CONTRACTOR: Contractor = {
  id: DEMO_CONTRACTOR_ID,
  name: "Apex Roofing & Exteriors",
  logoUrl: null,
  brandColor: "#c2410c",
  phone: "(503) 555-0142",
  email: "estimates@apexroofing.example",
  licenseNo: "CCB #224180",
  passwordHash: null,
  rateConfig: null,
  createdAt: "2026-01-02T00:00:00.000Z",
};

/** Seed jobs so the dashboard is populated on first load. */
export const DEMO_SEED_JOBS = [
  {
    homeownerName: "Dana & Mark Whitfield",
    homeownerEmail: "dana.whitfield@example.com",
    address: "4821 SE Lincoln St, Portland, OR 97215",
    vertical: "roofing" as const,
    status: "estimated" as const,
  },
  {
    homeownerName: "Priya Raghunathan",
    homeownerEmail: "praghu@example.com",
    address: "1190 NW Overton St, Portland, OR 97209",
    vertical: "gutters" as const,
    status: "paid" as const,
  },
  {
    homeownerName: "The Castellano Residence",
    homeownerEmail: null,
    address: "8800 N Lombard St, Portland, OR 97203",
    vertical: "siding" as const,
    status: "new" as const,
  },
];
