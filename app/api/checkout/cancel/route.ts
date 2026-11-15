import { limitAiRoute } from "@/lib/rate-limit";
import { stripeClient } from "@/lib/stripe";

// POST { sessionId: "cs_test_…" } → { ok, status }: cancels the Stripe test subscription that this checkout
// started, right away, so "Cancel Plus" really cancels and no renewal is ever billed. Test mode only.
// There are no accounts (FAQ Q135): the checkout session id that the browser kept is the only key.
export async function POST(request: Request) {
  const limited = limitAiRoute("checkout", request);
  if (limited) return limited;

  const stripe = stripeClient();
  if (!stripe) return Response.json({ ok: false, code: "no_keys" }, { status: 503 });

  let sessionId: unknown;
  try {
    sessionId = ((await request.json()) as { sessionId?: unknown } | null)?.sessionId;
  } catch {
    sessionId = undefined;
  }
  if (typeof sessionId !== "string" || !/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) {
    return Response.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const sub = session.subscription;
    if (typeof sub !== "object" || sub === null) return Response.json({ ok: false, code: "no_subscription" }, { status: 404 });
    if (sub.status === "canceled") return Response.json({ ok: true, status: "canceled" });
    const canceled = await stripe.subscriptions.cancel(sub.id);
    return Response.json({ ok: canceled.status === "canceled", status: canceled.status });
  } catch (err) {
    console.warn(`[checkout/cancel] ${err instanceof Error ? err.message : err}`);
    return Response.json({ ok: false, code: "stripe_error" }, { status: 502 });
  }
}
