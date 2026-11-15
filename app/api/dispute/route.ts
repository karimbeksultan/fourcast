import { writeDispute } from "@/lib/dispute";
import { limitAiRoute } from "@/lib/rate-limit";
import { DISPUTE_DETAILS_MAX, DisputeRequestSchema } from "@/lib/schema";
import type { DisputeError } from "@/lib/types";

// POST { lender, merchant, installment, paymentsLeft, nextDue, issue, returnedOn?, details?, today }
// → { letter: { subject, body }, source: "ai" | "template" }. Without AI keys the template answers,
// so the feature always works. Nothing is stored; no names, order numbers or e-mails are asked for.
// The AI budget is 10 s, stretched to 40 s on the last-resort model (lib/llm.ts); give the function room
// so Vercel never cuts it off first and the UI always gets our JSON error, not a platform 504.
export const maxDuration = 60;

const fail = (code: DisputeError, error: string, status: number) => Response.json({ error, code }, { status });

export async function POST(request: Request) {
  // First, before reading the body: 30 a minute per IP keeps the free AI quota safe (429 rate_limited).
  const limited = await limitAiRoute("dispute", request);
  if (limited) return limited;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("bad_request", "Send the plan as JSON.", 400);
  }

  const details = (raw as { details?: unknown } | null)?.details;
  if (typeof details === "string" && details.length > DISPUTE_DETAILS_MAX) {
    return fail("too_large", `Keep the details under ${DISPUTE_DETAILS_MAX} characters.`, 413);
  }

  const parsed = DisputeRequestSchema.safeParse(raw);
  if (!parsed.success) return fail("bad_request", "Some plan details are missing or wrong.", 400);

  return Response.json(await writeDispute(parsed.data));
}
