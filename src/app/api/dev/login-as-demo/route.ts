import { NextResponse } from "next/server";
import { setContractorCookie } from "@/lib/auth/session";
import { DEMO_CONTRACTOR_ID } from "@/lib/db/demo";

/** Instant demo sign-in: sets the contractor cookie to the seeded demo tenant. */
export async function GET(req: Request) {
  await setContractorCookie(DEMO_CONTRACTOR_ID);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
