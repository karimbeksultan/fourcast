// Server only: the dispute letter for a returned or wrongly charged plan (Limit Guard F3).
// The template always works, with or without AI keys. With a key, the AI may rewrite it,
// but its draft is used only if it keeps every fact and placeholder; otherwise the template wins.
// Only facts of the plan go in: the person fills [Your name] and [Order number] themselves (FAQ Q26).
import { formatLong, formatUSD } from "./dates";
import { askFirst, extractJson, LlmError, providers } from "./llm";
import { DisputeLetterSchema } from "./schema";
import type { DisputeLetter, DisputeRequest } from "./types";

export const CFPB_URL = "https://www.consumerfinance.gov/complaint/";
/** How long the dispute letter waits for the AI before the template answers. */
export const DISPUTE_AI_MS = 8_000;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function templateLetter(r: DisputeRequest): DisputeLetter {
  const amount = formatUSD(r.installment);
  const order = r.merchant ? `my ${r.merchant} order` : "my order";
  const left =
    r.paymentsLeft > 0
      ? `${r.paymentsLeft} ${plural(r.paymentsLeft, "payment", "payments")} of ${amount} ${plural(r.paymentsLeft, "is", "are")} still scheduled, the next one on ${formatLong(r.nextDue)}`
      : `The plan shows no payments left; the last one of ${amount} was due on ${formatLong(r.nextDue)}`;
  const next =
    r.paymentsLeft > 0
      ? `My next payment of ${amount} is scheduled for ${formatLong(r.nextDue)}.`
      : "No more payments are scheduled on this plan.";
  const on = r.returnedOn ? ` on ${formatLong(r.returnedOn)}` : "";

  const cases = {
    refund_not_applied: {
      subject: `Refund not applied to ${order}`,
      facts: `I returned this order${on}, but the refund has not been applied to my plan. ${left}.`,
      ask: "Please pause the remaining payments until the refund is applied and return any amount already taken for this order.",
    },
    charged_after_cancel: {
      subject: `Still charged after cancelling ${order}`,
      facts: `I cancelled this order${on}, but my plan is still active. ${left}.`,
      ask: "Please stop the remaining payments and return any amount taken after I cancelled.",
    },
    double_charge: {
      subject: `Charged twice for ${order}`,
      facts: `I was charged twice for one payment of ${amount} on this plan. ${next}`,
      ask: "Please refund the duplicate payment.",
    },
    other: {
      subject: `Problem with my plan for ${order}`,
      facts: `There is a problem with this plan. ${left}.`,
      ask: "Please look into it and fix my plan.",
    },
  } as const;
  const c = cases[r.issue];

  const body = [
    `Hello ${r.lender} support,`,
    `I'm writing about my pay-later plan for ${order} (order number [Order number]).`,
    c.facts,
    r.details?.trim() ? `In my words: ${r.details.trim()}` : null,
    `${c.ask} Please make sure this is not reported as a late payment and does not lower my spending limit.`,
    `Please confirm in writing. If I don't hear back within 15 days, I will file a complaint with the Consumer Financial Protection Bureau (${CFPB_URL}).`,
    "Thank you,\n[Your name]",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject: `${r.lender}: ${c.subject}`, body };
}

/** The AI draft is used only if it keeps the facts: lender, amount, placeholders, and no dollar amounts we didn't give it. */
export function keepsFacts(letter: DisputeLetter, r: DisputeRequest): boolean {
  const amount = formatUSD(r.installment);
  const allowed = new Set([amount, formatUSD(r.installment * r.paymentsLeft)]);
  const amounts = letter.body.match(/\$[\d,]+(\.\d{2})?/g) ?? [];
  return (
    letter.body.includes(r.lender) &&
    letter.body.includes(amount) &&
    letter.body.includes("[Your name]") &&
    letter.body.includes("[Order number]") &&
    amounts.every((a) => allowed.has(a.includes(".") ? a : `${a}.00`))
  );
}

function prompt(r: DisputeRequest, draft: DisputeLetter): string {
  return [
    "You help a US consumer write to a Buy Now, Pay Later lender about a plan that went wrong.",
    "Rewrite the draft below so it is clear, polite and firm, under 180 words. Use only the facts in the draft.",
    "Keep these exactly as written: the lender name, every dollar amount, every date, [Order number], [Your name], and the CFPB link.",
    "Never invent names, order numbers, e-mails, dates, amounts or laws.",
    `Today is ${r.today}.`,
    'Reply with one JSON object and nothing else: {"subject": "...", "body": "..."} (body uses \\n for line breaks).',
    "",
    `Subject: ${draft.subject}`,
    draft.body,
  ].join("\n");
}

/** The letter for /api/dispute: the AI draft when it keeps every fact, otherwise the template. Nothing is stored. */
export async function writeDispute(r: DisputeRequest): Promise<{ letter: DisputeLetter; source: "ai" | "template" }> {
  const template = templateLetter(r);
  if (providers().length === 0) return { letter: template, source: "template" };
  try {
    // The template is always ready, so the AI gets 8 s and never the slow last-resort stretch.
    const letter = await askFirst(
      [{ role: "user", content: prompt(r, template) }],
      (text) => {
        const parsed = DisputeLetterSchema.safeParse(extractJson(text));
        return parsed.success && keepsFacts(parsed.data, r) ? parsed.data : null;
      },
      { budgetMs: DISPUTE_AI_MS, lastResortMs: DISPUTE_AI_MS },
    );
    return { letter, source: "ai" };
  } catch (err) {
    if (!(err instanceof LlmError)) console.warn(`[dispute] ${err instanceof Error ? err.message : err}`);
    return { letter: template, source: "template" };
  }
}
