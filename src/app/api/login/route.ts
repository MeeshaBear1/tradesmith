import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { setContractorCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { badRequest, readJson } from "@/lib/http";

/** Sign in with email + passphrase. */
export async function POST(req: Request) {
  const body = await readJson<{ email?: string; password?: string }>(req);
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";
  if (!email || !password) return badRequest("invalid_fields");

  const store = await getStore();
  const contractor = await store.getContractorByEmail(email);
  if (!contractor || !verifyPassword(password, contractor.passwordHash)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }
  await setContractorCookie(contractor.id);
  return NextResponse.json({ ok: true });
}
