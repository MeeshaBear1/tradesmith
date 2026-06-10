import { NextResponse } from "next/server";
import { getContractorId } from "@/lib/auth/session";
import { getStore } from "@/lib/db/store";
import { badRequest, readJson, unauthorized } from "@/lib/http";
import { isVertical } from "@/lib/verticals/registry";

export async function POST(req: Request) {
  const contractorId = await getContractorId();
  if (!contractorId) return unauthorized();

  const body = await readJson<{
    homeownerName: string;
    homeownerEmail?: string;
    address: string;
    vertical?: string;
  }>(req);
  if (!body?.homeownerName?.trim() || !body?.address?.trim()) {
    return badRequest("missing_fields");
  }

  const store = await getStore();
  const job = await store.createJob({
    contractorId,
    vertical: body.vertical && isVertical(body.vertical) ? body.vertical : "roofing",
    homeownerName: body.homeownerName.trim(),
    homeownerEmail: body.homeownerEmail?.trim() || null,
    address: body.address.trim(),
    lat: null,
    lng: null,
  });
  return NextResponse.json({ job });
}
