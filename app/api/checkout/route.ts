import { limitAiRoute } from "@/lib/rate-limit";
import { PLUS_MONTHLY_CENTS, PLUS_PRICE_CENTS, stripeClient, trialEndUnix } from "@/lib/stripe";

// POST { trialEnds: "YYYY-MM-DD", plan?: "year" | "month" } → { url } of a Stripe Checkout page in test mode:
// Fourcast Plus at $29.99 a year (default) or $4.99 a month, free until trialEnds (the user's second payday).
// No test key → 503 no_keys, and the UI keeps its demo checkout.
export async function POST(request: Request) {
  // 30 a minute per IP: every call creates a Stripe session.
  const limited = await limitAiRoute("checkout", request);
  if (limited) return limited;

  const stripe = stripeClient();
  if (!stripe) return Response.json({ error: "Test payments are off.", code: "no_keys" }, { status: 503 });

  let body: { trialEnds?: unknown; plan?: unknown } = {};
  try {
    const raw: unknown = await request.json();
    if (raw && typeof raw === "object") body = raw;
  } catch {
    // handled below as a bad request
  }
  const { trialEnds } = body;
  const plan = body.plan ?? "year";
  if (
    typeof trialEnds !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(trialEnds) ||
    Number.isNaN(Date.parse(trialEnds)) ||
    (plan !== "year" && plan !== "month")
  ) {
    return Response.json(
      { error: "Send { trialEnds: \"YYYY-MM-DD\", plan: \"year\" | \"month\" }.", code: "bad_request" },
      { status: 400 },
    );
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
            unit_amount: plan === "month" ? PLUS_MONTHLY_CENTS : PLUS_PRICE_CENTS,
            recurring: { interval: plan },
            product_data: {
              name: "Fourcast Plus",
              description: "A heads-up at 8 pm before a pay-later payment won't make it. Payday Sync. Exact shortfall before you buy.",
            },
          },
        },
      ],
      subscription_data: { trial_end: trialEndUnix(trialEnds) },
      // The sandbox account has no public business name yet, so Checkout would show the sandbox's own name.
      branding_settings: { display_name: "Fourcast" },
      // US product: always US dollars in English, never converted to the visitor's local currency or language.
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
