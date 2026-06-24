import { NextResponse } from "next/server";

/** Parse a JSON body without throwing on malformed input. */
export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const badRequest = (error = "bad_request") => NextResponse.json({ error }, { status: 400 });
export const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
export const forbidden = (error = "forbidden") => NextResponse.json({ error }, { status: 403 });
export const notFoundJson = (error = "not_found") => NextResponse.json({ error }, { status: 404 });
export const conflict = (error = "conflict") => NextResponse.json({ error }, { status: 409 });
export const tooManyRequests = (retryAfterSec = 60) =>
  NextResponse.json(
    { error: "rate_limited", retryAfterSec },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
