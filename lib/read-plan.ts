// Server only: turns a pasted confirmation or a screenshot into a Plan.
// This is the only place Fourcast uses AI; all math stays in lib/plan.ts.
import { askFirst, extractJson, type ChatMessage } from "./llm";
import { PlanDraftSchema } from "./schema";
import type { PlanDraft } from "./schema";
import { LENDERS, type ISODate, type Plan } from "./types";

/** Days between payments: 7 weekly, 30 for monthly plans (Affirm), otherwise 14 (Pay in 4). */
const INTERVAL = { week: 7, "2 weeks": 14, month: 30 } as const;

/** The AI's draft (dollars) as a Plan (cents). Exported for the golden tests. */
export function planFromDraft(draft: PlanDraft, id: string): Plan {
  return {
    id,
    lender: draft.lender,
    merchant: draft.merchant,
    installment: Math.round(draft.installment * 100),
    paymentsLeft: draft.paymentsLeft,
    nextDue: draft.nextDue,
    intervalDays: INTERVAL[draft.every ?? "2 weeks"],
    ...(draft.totalPayments && draft.totalPayments >= draft.paymentsLeft ? { totalPayments: draft.totalPayments } : {}),
  };
}

function prompt(today: ISODate): string {
  return [
    "You read Buy Now, Pay Later confirmations (Klarna, Afterpay, Affirm, Zip, PayPal Pay in 4).",
    `Today is ${today}. Dates without a year are the next such date on or after today.`,
    "Reply with one JSON object and nothing else:",
    `{"lender": one of ${LENDERS.map((l) => `"${l}"`).join(", ")},`,
    ' "merchant": store name or "",',
    ' "installment": amount of each remaining payment in US dollars (number),',
    ' "paymentsLeft": number of payments not yet made (integer),',
    ' "totalPayments": payments in the whole plan, e.g. 4 for "payment 2 of 4" (integer, or null if not shown),',
    ' "every": how often a payment is taken: "2 weeks" for Pay in 4, "month" for monthly plans, "week" if weekly (or null if not shown),',
    ' "nextDue": date of the next payment as YYYY-MM-DD}',
    'If this is not a pay-later plan, reply {"error":"unreadable"}.',
  ].join("\n");
}

export async function readPlan(input: { text?: string; imageBase64?: string }, today: ISODate): Promise<Plan> {
  const user: ChatMessage["content"] = [];
  if (input.text) user.push({ type: "text", text: input.text.slice(0, 4_000) });
  if (input.imageBase64) {
    const url = input.imageBase64.startsWith("data:") ? input.imageBase64 : `data:image/jpeg;base64,${input.imageBase64}`;
    user.push({ type: "image_url", image_url: { url } });
  }
  const messages: ChatMessage[] = [
    { role: "system", content: prompt(today) },
    { role: "user", content: user },
  ];

  const draft = await askFirst(messages, (text) => {
    const parsed = PlanDraftSchema.safeParse(extractJson(text));
    return parsed.success ? parsed.data : null;
  });

  return planFromDraft(draft, `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
}
