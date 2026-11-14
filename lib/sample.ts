// Sample data for the demo, labelled "Sample data" in the UI. Every date is built
// from `today`, so the story works on whatever day the jury opens the link.
// It goes through the same logic as real input (FAQ Q66, Q94). Expected numbers: demo_inputs.md.
import { addDays, formatLong, formatShort, parts } from "./dates";
import type { AppState, ISODate, Plan } from "./types";

export function getSampleState(today: ISODate): AppState {
  return {
    version: 1,
    sample: true,
    plus: null,
    money: {
      balance: 92_250,
      paycheck: 145_000,
      frequency: "biweekly",
      nextPayday: addDays(today, 5),
      rent: 120_000,
      rentDay: parts(addDays(today, 16)).day,
      weeklySpend: 28_000,
    },
    plans: [
      {
        id: "sample-afterpay",
        lender: "Afterpay",
        merchant: "Nike",
        installment: 5_000,
        paymentsLeft: 1,
        nextDue: addDays(today, 2),
        intervalDays: 14,
      },
      {
        id: "sample-affirm",
        lender: "Affirm",
        merchant: "Best Buy",
        installment: 17_500,
        paymentsLeft: 2,
        nextDue: addDays(today, 7),
        intervalDays: 14,
      },
      {
        // Due on a payday (today+19): autopay runs in the morning, the paycheck lands later.
        // Safe on its own; once the Klarna plan is added, checking is $12.50 short that morning (Guard).
        id: "sample-zip",
        lender: "Zip",
        merchant: "Walmart",
        installment: 4_000,
        paymentsLeft: 1,
        nextDue: addDays(today, 19),
        intervalDays: 14,
      },
    ],
  };
}

/** The Klarna plan the demo adds in step 2 (what the AI should read from the text below). */
export function getSampleKlarnaPlan(today: ISODate): Plan {
  return {
    id: "sample-klarna",
    lender: "Klarna",
    merchant: "Target",
    installment: 8_000,
    paymentsLeft: 3,
    nextDue: addDays(today, 4),
    intervalDays: 14,
  };
}

/** A Klarna confirmation to paste in the demo. The AI reads it live; nothing is cached. */
export function getSampleKlarnaText(today: ISODate): string {
  const first = addDays(today, -10);
  const next = addDays(today, 4);
  return [
    "Klarna",
    "You paid $80.00 at Target",
    `Order total $320.00 · Pay in 4 · placed ${formatLong(first)}`,
    "1 of 4 payments made",
    `Next payment: $80.00 on ${formatShort(next)}, ${parts(next).year}`,
    "Then every 2 weeks until paid off",
    "Remaining balance: $240.00",
  ].join("\n");
}
