// Server only. Stripe in test mode for the Plus paywall. Without a test key the UI keeps its demo checkout.
import Stripe from "stripe";

export const PLUS_PRICE_CENTS = 2999; // $29.99 a year
export const PLUS_MONTHLY_CENTS = 499; // $4.99 a month
const MIN_TRIAL_SECONDS = 49 * 3600; // Stripe wants trial_end at least 48 hours ahead

/** A Stripe client, or null when STRIPE_SECRET_KEY is missing or is not a test key (we never take real money). */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !/^(sk|rk)_test_/.test(key)) return null;
  return new Stripe(key);
}

/** Unix time for the end of the free trial: noon UTC on `trialEnds`, but never sooner than Stripe allows. */
export function trialEndUnix(trialEnds: string, nowMs = Date.now()): number {
  const end = Math.floor(Date.parse(`${trialEnds}T12:00:00Z`) / 1000);
  return Math.max(end, Math.floor(nowMs / 1000) + MIN_TRIAL_SECONDS);
}
