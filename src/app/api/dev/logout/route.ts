import { NextResponse } from "next/server";
import { clearContractorCookie } from "@/lib/auth/session";

export async function GET(req: Request) {
  await clearContractorCookie();
  return NextResponse.redirect(new URL("/", req.url));
}
