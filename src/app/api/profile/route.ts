import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import type { ContractorProfileUpdate } from "@/lib/db/store";
import { badRequest, readJson, unauthorized } from "@/lib/http";

/** Edit the signed-in contractor's company profile (name/phone/email/license/brand/logo). */
export async function PATCH(req: Request) {
  const id = await getContractorId();
  if (!id) return unauthorized();

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const fields: ContractorProfileUpdate = {};
  if (typeof body.name === "string" && body.name.trim()) fields.name = body.name.trim();
  if (typeof body.phone === "string") fields.phone = body.phone.trim() || null;
  if (typeof body.email === "string") fields.email = body.email.trim() || null;
  if (typeof body.licenseNo === "string") fields.licenseNo = body.licenseNo.trim() || null;
  if (typeof body.brandColor === "string" && /^#[0-9a-fA-F]{6}$/.test(body.brandColor)) {
    fields.brandColor = body.brandColor;
  }
  if (typeof body.logoUrl === "string") {
    const u = body.logoUrl.trim();
    if (u === "") fields.logoUrl = null;
    else if (/^https:\/\//i.test(u)) fields.logoUrl = u; // https only — rendered on public pages
    else return badRequest("invalid_logo_url");
  }
  if (Object.keys(fields).length === 0) return badRequest("no_fields");

  const store = await getStore();
  const updated = await store.updateContractorProfile(id, fields);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
