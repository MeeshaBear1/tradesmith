/**
 * Centralized env + graceful-degradation flags.
 *
 * The whole app is designed to run with ZERO secrets (demo mode). Every external
 * integration checks `hasKey(service)` and falls back to a deterministic stub when
 * the key is absent, so the full loop always demos.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
  mapboxToken: process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
  stripeSecret: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Image-to-image render (Google Gemini 2.5 Flash Image, "Nano Banana"). Optional.
  geminiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "",
  // Transactional email (Resend). Optional — sends are fail-open and skipped without it.
  resendKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Tradesmith <onboarding@resend.dev>",
  // Error reporting (Sentry-compatible DSN). Optional — no-op until set.
  sentryDsn: process.env.SENTRY_DSN ?? "",
  demoMode: process.env.DEMO_MODE === "1" || process.env.NODE_ENV !== "production",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  sessionSecret: process.env.SESSION_SECRET ?? "tradesmith-dev-secret-change-me",
} as const;

// Fail-closed: refuse to run in production with a default/empty session secret,
// which would make the signed session cookie forgeable. Skipped during `next build`
// (env vars are injected at runtime on Vercel), enforced at runtime module-load.
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "tradesmith-dev-secret-change-me")
) {
  throw new Error(
    "SESSION_SECRET must be set to a strong, unique value in production (the default is forgeable).",
  );
}

export type Service = "supabase" | "anthropic" | "mapbox" | "stripe" | "render" | "email";

export function hasKey(service: Service): boolean {
  switch (service) {
    case "supabase":
      // The whole app uses the service-role client; without it the store is dead,
      // so require it (not just the anon key) before selecting the Supabase backend.
      return Boolean(env.supabaseUrl && env.supabaseServiceKey);
    case "anthropic":
      return Boolean(env.anthropicKey);
    case "mapbox":
      return Boolean(env.mapboxToken);
    case "stripe":
      return Boolean(env.stripeSecret && env.stripePublishable);
    case "render":
      // Generated renders also need somewhere to store the PNG, so require Storage.
      return Boolean(env.geminiKey && env.supabaseUrl && env.supabaseServiceKey);
    case "email":
      return Boolean(env.resendKey);
  }
}

/** Public-safe snapshot of which integrations are live (no secret values). */
export function integrationStatus() {
  return {
    supabase: hasKey("supabase"),
    anthropic: hasKey("anthropic"),
    mapbox: hasKey("mapbox"),
    stripe: hasKey("stripe"),
    render: hasKey("render"),
    email: hasKey("email"),
    demoMode: env.demoMode,
  };
}
