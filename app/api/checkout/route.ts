import { PLUS_PRICE_CENTS, stripeClient, trialEndUnix } from "@/lib/stripe";

// POST { trialEnds: "YYYY-MM-DD" } → { url } of a Stripe Checkout page in test mode:
// Fourcast Plus at $29.99 a year, free until trialEnds (the user's second payday).
// No test key → 503 no_keys, and the UI keeps its demo checkout.
export async function POST(request: Request) {
  const stripe = stripeClient();
  if (!stripe) return Response.json({ error: "Test payments are off.", code: "no_keys" }, { status: 503 });

  let trialEnds: unknown;
  try {
    trialEnds = ((await request.json()) as { trialEnds?: unknown }).trialEnds;
  } catch {
    trialEnds = undefined;
  }
  if (typeof trialEnds !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(trialEnds) || Number.isNaN(Date.parse(trialEnds))) {
    return Response.json({ error: "Send { trialEnds: \"YYYY-MM-DD\" }.", code: "bad_request" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PLUS_PRICE_CENTS,
            recurring: { interval: "year" },
            product_data: {
              name: "Fourcast Plus",
              description: "Payday Sync, the best day to buy, the exact shortfall, night-before reminders.",
            },
          },
        },
      ],
      subscription_data: { trial_end: trialEndUnix(trialEnds) },
      // US product: always $29.99 in English, never converted to the visitor's local currency or language.
      adaptive_pricing: { enabled: false },
      locale: "en",
      success_url: `${origin}/check?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/check`,
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL");
    return Response.json({ url: session.url });
  } catch (err) {
    console.warn(`[checkout] ${err instanceof Error ? err.message : err}`);
    return Response.json({ error: "Checkout is unavailable. Try again.", code: "stripe_error" }, { status: 502 });
  }
}
