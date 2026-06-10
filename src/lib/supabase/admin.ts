import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * Service-role client. Server-only — NEVER import into client components.
 * Used for all DB access (tenancy is enforced in app code via contractor_id)
 * and for powering token-gated public proposal/invoice pages.
 */
export function createAdminClient(): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
