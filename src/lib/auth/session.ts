import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { getStore } from "@/lib/db/store";
import type { Contractor } from "@/lib/db/types";

const COOKIE = "ts_contractor";
const MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Lightweight signed-cookie session. The contractor id is HMAC-signed so the
 * cookie can't be forged to impersonate another tenant. Works identically with
 * the Supabase or in-memory store. Real Supabase Auth (magic-link/SSO) layers on
 * top of this later.
 */
function sign(id: string): string {
  const h = crypto.createHmac("sha256", env.sessionSecret).update(id).digest("base64url");
  return `${id}.${h}`;
}

function verify(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const expected = sign(id);
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return id;
  return null;
}

export async function getContractorId(): Promise<string | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  return raw ? verify(raw) : null;
}

export async function setContractorCookie(id: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, sign(id), { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export async function clearContractorCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function getContractor(): Promise<Contractor | null> {
  const id = await getContractorId();
  if (!id) return null;
  const store = await getStore();
  return store.getContractor(id);
}

/** For dashboard server components: bounce to the landing page if not signed in. */
export async function requireContractor(): Promise<Contractor> {
  const contractor = await getContractor();
  if (!contractor) redirect("/");
  return contractor;
}
