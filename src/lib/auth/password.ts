import crypto from "node:crypto";

/**
 * Pilot-grade password hashing (scrypt, per-hash random salt). Stored as `salt:hash`.
 * Real OAuth/SSO layers on later; this is enough to give each pilot contractor their
 * own tenant without a wide-open email-only login.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return test.length === expected.length && crypto.timingSafeEqual(test, expected);
}
