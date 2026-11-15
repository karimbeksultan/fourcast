import { connection } from "next/server";
import { stripeClient } from "@/lib/stripe";

// GET ?session_id=cs_test_… → { ok }: true once Stripe says the checkout is complete and the subscription is live.
// The UI calls it on /check?session_id=… after Stripe sends the user back, then turns Plus on.
export async function GET(request: Request) {
  await connection(); // reads env and asks Stripe at request time, never at build time
  const stripe = stripeClient();
  if (!stripe) return Response.json({ ok: false, code: "no_keys" }, { status: 503 });

  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) {
    return Response.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  try {
    // Plus turns on only for a finished subscription checkout whose subscription is still live (trial or paid):
    // a cancelled or unpaid one no longer counts. Sessions aren't tied to a person (no accounts, FAQ Q135).
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const sub = session.subscription;
    const live = typeof sub === "object" && sub !== null && (sub.status === "trialing" || sub.status === "active");
    return Response.json({ ok: session.status === "complete" && session.mode === "subscription" && live });
  } catch (err) {
    console.warn(`[checkout/confirm] ${err instanceof Error ? err.message : err}`);
    return Response.json({ ok: false, code: "stripe_error" }, { status: 502 });
  }
}
