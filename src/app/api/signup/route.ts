import { NextResponse, after } from "next/server";
import { getStore } from "@/lib/db/store";
import { setContractorCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { sendSignupWelcome } from "@/lib/email/send";
import { badRequest, readJson } from "@/lib/http";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Create your own shop (a real tenant) and sign in. */
export async function POST(req: Request) {
  const body = await readJson<{
    company?: string;
    email?: string;
    password?: string;
    phone?: string;
    licenseNo?: string;
    brandColor?: string;
  }>(req);

  const company = (body?.company ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";
  if (!company || !EMAIL_RE.test(email)) return badRequest("invalid_fields");
  if (password.length < 8) return badRequest("weak_password");

  const store = await getStore();
  if (await store.getContractorByEmail(email)) return badRequest("email_taken");

  const brandColor = /^#[0-9a-fA-F]{6}$/.test(body?.brandColor ?? "") ? body!.brandColor! : "#ea4e1c";
  const contractor = await store.createContractor({
    name: company,
    email,
    phone: (body?.phone ?? "").trim() || null,
    licenseNo: (body?.licenseNo ?? "").trim() || null,
    brandColor,
    logoUrl: null,
    passwordHash: hashPassword(password),
  });
  await setContractorCookie(contractor.id);

  // Welcome email after the response — fail-open, skipped without a mail key.
  if (contractor.email) {
    const email = contractor.email;
    after(() => sendSignupWelcome(email, contractor.name).catch(() => {}));
  }
  return NextResponse.json({ ok: true });
}
