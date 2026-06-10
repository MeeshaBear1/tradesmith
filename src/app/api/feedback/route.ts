import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { badRequest, readJson } from "@/lib/http";
import type { FeedbackKind } from "@/lib/db/types";

const KINDS: FeedbackKind[] = ["waitlist", "feedback", "demo_request"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public waitlist / feedback capture. */
export async function POST(req: Request) {
  const body = await readJson<{
    kind?: string;
    name?: string;
    email?: string;
    company?: string;
    role?: string;
    message?: string;
  }>(req);

  const name = body?.name?.trim();
  const email = body?.email?.trim();
  if (!name || !email || !EMAIL.test(email)) return badRequest("name_and_valid_email_required");

  const kind = (KINDS.includes(body?.kind as FeedbackKind) ? body!.kind : "waitlist") as FeedbackKind;

  const store = await getStore();
  await store.createFeedback({
    kind,
    name: name.slice(0, 200),
    email: email.slice(0, 200),
    company: body?.company?.trim().slice(0, 200) || null,
    role: body?.role?.trim().slice(0, 120) || null,
    message: body?.message?.trim().slice(0, 4000) || null,
  });

  return NextResponse.json({ ok: true });
}
