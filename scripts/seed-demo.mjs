/**
 * Rich demo seeder — drives the REAL engine through the live API so the demo tenant
 * (Apex Roofing, via /api/dev/login-as-demo) shows a full, believable pipeline.
 * Usage: node scripts/seed-demo.mjs [baseUrl]
 */
const BASE = (process.argv[2] || "https://tradesmith-nu.vercel.app").replace(/\/$/, "");

const JOBS = [
  { name: "Marcus & Lena Powell", email: "powell@example.com", address: "3402 SE Belmont St, Portland, OR 97214", stage: "paid" },
  { name: "The Okafor Residence", email: "okafor@example.com", address: "7120 N Greenwich Ave, Portland, OR 97217", stage: "paid" },
  { name: "Sandra Beckett", email: "sbeckett@example.com", address: "1845 NE Klickitat St, Portland, OR 97212", stage: "accepted" },
  { name: "Tyler & Jess Romero", email: "romero@example.com", address: "5560 SW Dosch Rd, Portland, OR 97239", stage: "viewed" },
  { name: "Harold Nguyen", email: "hnguyen@example.com", address: "9203 SE Foster Rd, Portland, OR 97266", stage: "proposed" },
  { name: "Bianca Salvatore", email: "bianca@example.com", address: "410 NW 24th Ave, Portland, OR 97210", stage: "estimated" },
  { name: "The Delgado Family", email: "delgado@example.com", address: "6628 N Montana Ave, Portland, OR 97217", stage: "estimated" },
  { name: "Owen Pierce", email: "opierce@example.com", address: "2233 SE 50th Ave, Portland, OR 97215", stage: "measured" },
  { name: "Renata Vasquez", email: "renata@example.com", address: "1377 NE Dekum St, Portland, OR 97211", stage: "new" },
];

let COOKIE = "";
async function req(path, { method = "GET", body, raw = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(COOKIE ? { cookie: COOKIE } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const setc = res.headers.get("set-cookie");
  if (setc) COOKIE = setc.split(";")[0];
  if (raw) return res;
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    return { status: res.status, json: null, text };
  }
}

async function seedJob(j) {
  const { json: jobRes } = await req("/api/jobs", { method: "POST", body: { homeownerName: j.name, homeownerEmail: j.email, address: j.address, vertical: "roofing" } });
  const jobId = jobRes?.job?.id;
  if (!jobId) throw new Error("no jobId for " + j.name);
  if (j.stage === "new") return jobId;

  const { json: meas } = await req("/api/takeoff/measure", { method: "POST", body: { jobId } });
  const detail = meas?.measurement?.detail;
  if (j.stage === "measured") {
    await req(`/api/jobs/${jobId}/status`, { method: "PATCH", body: { status: "measured" } });
    return jobId;
  }

  const { json: est } = await req("/api/estimate", { method: "POST", body: { jobId, detail, selectedTier: "better" } });
  const estimateId = est?.estimateId;
  if (j.stage === "estimated") {
    await req(`/api/jobs/${jobId}/status`, { method: "PATCH", body: { status: "estimated" } });
    return jobId;
  }

  const { json: prop } = await req("/api/proposal", { method: "POST", body: { jobId, estimateId, selectedTier: "better" } });
  const token = prop?.token;
  if (j.stage === "proposed") return jobId;

  if (j.stage === "viewed") {
    await req(`/p/${token}`, { raw: true }); // public GET flips sent -> viewed
    return jobId;
  }

  const { json: acc } = await req(`/api/proposal/${token}/accept`, { method: "POST", body: { signatureName: j.name, selectedTier: "better" } });
  const invoiceToken = acc?.invoiceToken;
  if (j.stage === "paid" && invoiceToken) {
    await req(`/api/invoice/${invoiceToken}/mark-paid`, { method: "POST", body: {} });
  }
  return jobId;
}

const out = [];
await req("/api/dev/login-as-demo", { raw: true });
if (!COOKIE) {
  console.error("Could not get demo session cookie. Is /api/dev/login-as-demo enabled?");
  process.exit(1);
}
for (const j of JOBS) {
  try {
    const id = await seedJob(j);
    out.push(`OK  ${j.stage.padEnd(10)} ${j.name} (${id.slice(0, 8)})`);
  } catch (e) {
    out.push(`ERR ${j.stage.padEnd(10)} ${j.name}: ${String(e.message || e)}`);
  }
}
console.log(out.join("\n"));
console.log("\nDone. Open " + BASE + "/api/dev/login-as-demo then /dashboard");
