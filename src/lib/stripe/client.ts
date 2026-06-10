import Stripe from "stripe";
import { env } from "@/config/env";

/** Returns a Stripe client (test mode) or null when no secret is configured. */
export function getStripe(): Stripe | null {
  if (!env.stripeSecret) return null;
  return new Stripe(env.stripeSecret);
}
