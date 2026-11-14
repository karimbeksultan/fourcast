import { connection } from "next/server";
import { stripeClient } from "@/lib/stripe";

// GET ?session_id=cs_test_… → { ok }: true once Stripe says the checkout is complete.
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
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return Response.json({ ok: session.status === "complete" });
  } catch (err) {
    console.warn(`[checkout/confirm] ${err instanceof Error ? err.message : err}`);
    return Response.json({ ok: false, code: "stripe_error" }, { status: 502 });
  }
}
