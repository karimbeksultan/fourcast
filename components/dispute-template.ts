// Dispute letter by template (LIMIT_GUARD.md F3). Used when /api/dispute is not there or answers with an error.
// Only plan facts and placeholders: no names, e-mails or order numbers are collected.
import { formatLong, formatUSD } from "@/lib/dates";
import type { ISODate, Lender } from "@/lib/types";

export type DisputeIssue = "refund_not_applied" | "charged_after_cancel" | "double_charge" | "other";

export const ISSUES: { id: DisputeIssue; label: string }[] = [
  { id: "refund_not_applied", label: "I returned it, but the refund isn't applied" },
  { id: "charged_after_cancel", label: "The order was cancelled, but I'm still charged" },
  { id: "double_charge", label: "I was charged twice" },
  { id: "other", label: "Something else" },
];

export type DisputeInput = {
  lender: Lender;
  merchant: string;
  installment: number;
  paymentsLeft: number;
  nextDue: ISODate | null;
  issue: DisputeIssue;
  returnedOn?: ISODate | null;
  details?: string;
};

export type Letter = { subject: string; body: string };

const PROBLEM: Record<DisputeIssue, string> = {
  refund_not_applied: "I returned the item, but the refund hasn't been applied to my plan, and payments are still scheduled.",
  charged_after_cancel: "The order was cancelled, but I'm still being charged for it.",
  double_charge: "I was charged twice for the same payment.",
  other: "There's a problem with this plan that I need fixed.",
};

const ASK: Record<DisputeIssue, string> = {
  refund_not_applied: "stop the remaining payments and refund any payment already taken for this order",
  charged_after_cancel: "stop the remaining payments and refund any payment already taken for this order",
  double_charge: "refund the duplicate payment",
  other: "look into this and fix it",
};

const SUBJECT: Record<DisputeIssue, string> = {
  refund_not_applied: "Refund not applied",
  charged_after_cancel: "Charged after the order was cancelled",
  double_charge: "Charged twice",
  other: "Problem with my plan",
};

export function draftDispute(i: DisputeInput): Letter {
  const order = i.merchant ? `my order from ${i.merchant}` : "my order";
  const facts = [
    i.returnedOn ? `- I returned the item on ${formatLong(i.returnedOn)}.` : null,
    `- My plan has ${i.paymentsLeft} ${i.paymentsLeft === 1 ? "payment" : "payments"} of ${formatUSD(i.installment)} left.`,
    i.nextDue ? `- The next one is scheduled for ${formatLong(i.nextDue)}.` : null,
  ].filter(Boolean);
  const details = i.details?.trim() ? `\nMore details: ${i.details.trim()}\n` : "";
  return {
    subject: `${SUBJECT[i.issue]}: ${i.lender} Pay in 4 plan for ${i.merchant || "my order"}`,
    body: [
      `Hello ${i.lender} support,`,
      "",
      `I'm writing about my Pay in 4 plan for ${order} ([Order number]).`,
      "",
      PROBLEM[i.issue],
      ...facts,
      details,
      `Please ${ASK[i.issue]}, and confirm in writing.`,
      "",
      "If this isn't resolved within 15 days, I'll file a complaint with the Consumer Financial Protection Bureau.",
      "",
      "Thank you,",
      "[Your name]",
      `[E-mail on my ${i.lender} account]`,
    ].join("\n"),
  };
}
