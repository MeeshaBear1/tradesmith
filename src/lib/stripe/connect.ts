import { getStripe } from "@/lib/stripe/client";
import { reportError } from "@/lib/observability";

/**
 * Tier 2 scaffold — Stripe Connect onboarding (the first step of "own the rails").
 *
 * This creates (or reuses) a Connect **Express** account for a contractor and returns
 * a hosted onboarding link. It is intentionally bounded: it does NOT yet route charges
 * to the connected account — today's deposits still collect to the platform account.
 * Wiring payouts (persist the account id on the contractor, then charge with
 * `on_behalf_of` / `transfer_data`) is the next step. See docs/TIER2_MOAT.md.
 *
 * Key-gated + fail-soft: a no-op (`configured:false`) without Stripe keys, and it
 * requires a Connect-enabled platform account to actually succeed.
 */

export interface ConnectOnboarding {
  configured: boolean;
  accountId?: string;
  onboardingUrl?: string;
  reason?: string;
}

export async function createConnectOnboarding(args: {
  contractorId: string;
  email: string | null;
  existingAccountId?: string | null;
  returnUrl: string;
  refreshUrl: string;
}): Promise<ConnectOnboarding> {
  const stripe = getStripe();
  if (!stripe) return { configured: false, reason: "stripe_not_configured" };

  try {
    let accountId = args.existingAccountId ?? undefined;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: args.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { contractorId: args.contractorId },
      });
      accountId = account.id;
    }
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      return_url: args.returnUrl,
      refresh_url: args.refreshUrl,
    });
    return { configured: true, accountId, onboardingUrl: link.url };
  } catch (err) {
    reportError(err, { where: "createConnectOnboarding", contractorId: args.contractorId });
    return { configured: false, reason: err instanceof Error ? err.message : "connect_failed" };
  }
}
