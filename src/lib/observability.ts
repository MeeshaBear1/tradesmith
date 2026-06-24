import { env } from "@/config/env";

/**
 * Best-effort error reporting. Today, failures in the AI/payment/email paths are
 * console-only and invisible in production. This always emits a structured log line
 * (picked up by Vercel/Supabase log drains) and, when SENTRY_DSN is set, also ships
 * a minimal event to Sentry. It never throws — observability must not break a flow.
 *
 * No-op-until-DSN, fail-open posture (same as Verdict). For richer traces, drop in
 * @sentry/nextjs later behind this same `reportError` call site.
 */

export interface ErrorContext {
  where?: string;
  contractorId?: string;
  [k: string]: unknown;
}

const SECRET_RE = /(key|secret|token|password|authorization|cookie)/i;

function redact(ctx: ErrorContext): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    out[k] = SECRET_RE.test(k) ? "[redacted]" : v;
  }
  return out;
}

export function reportError(error: unknown, ctx: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  try {
    console.error(JSON.stringify({ level: "error", message, ...redact(ctx) }));
  } catch {
    console.error("reportError:", message);
  }
  if (env.sentryDsn) void shipToSentry(message, stack, ctx);
}

/** Minimal Sentry store-endpoint POST, dependency-free and fully best-effort. */
async function shipToSentry(message: string, stack: string | undefined, ctx: ErrorContext): Promise<void> {
  try {
    // DSN: https://<publicKey>@<host>/<projectId>
    const m = env.sentryDsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!m) return;
    const [, publicKey, host, projectId] = m;
    const url = `https://${host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;
    const body = {
      platform: "node",
      level: "error",
      logger: "tradesmith",
      message: { formatted: message },
      tags: { where: ctx.where ?? "unknown" },
      extra: redact(ctx),
      ...(stack ? { exception: { values: [{ type: "Error", value: message }] } } : {}),
    };
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* swallow — never let reporting break a request */
  }
}
