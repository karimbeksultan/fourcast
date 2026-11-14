// Concept "Tonight" (CONCEPT.md): helpers for the one-screen home. Money is still computed only in lib/plan.ts.
import { addDays, diffDays } from "./dates";
import { debitRisks, planDebits } from "./plan";
import { getSampleKlarnaPlan, getSampleState } from "./sample";
import type { AppState, Cents, DebitRisk, ISODate, Lender, Plan } from "./types";

/** Sample for the concept: the usual sample, plus the Klarna plan from the demo and one returned Afterpay order. */
export function getConceptSample(today: ISODate): AppState {
  const base = getSampleState(today);
  const returned: Plan = {
    id: "sample-nordstrom",
    lender: "Afterpay",
    merchant: "Nordstrom",
    installment: 4_000,
    // One payment left, due after the Dec 4 payday, so the sample keeps the demo numbers (Zip $12.50 short,
    // move $25) and the landing story matches the first app screen.
    paymentsLeft: 1,
    nextDue: addDays(today, 21),
    intervalDays: 14,
    status: "returned",
    returnedOn: addDays(today, -9),
    refundStage: "store_refunded",
  };
  return { ...base, limits: { Zip: 60_000, Klarna: 75_000 }, plans: [...base.plans, getSampleKlarnaPlan(today), returned] };
}

/** The risk to act on first: a payment that fails beats one that is only tight, then the earliest. Same order as Guard. */
export function nextRisk(state: AppState, today: ISODate): DebitRisk | null {
  return debitRisks(state, today).find((r) => !r.disputed) ?? null;
}

export type LenderOwed = { lender: Lender; plans: number; owed: Cents; lastDue: ISODate };

/** What's still owed per lender, biggest first. Returned plans count until the lender credits them: their payments are still scheduled. */
export function owedByLender(state: AppState, today: ISODate): LenderOwed[] {
  const map = new Map<Lender, LenderOwed>();
  for (const p of state.plans) {
    const debits = planDebits(p, today);
    if (debits.length === 0) continue;
    const row = map.get(p.lender) ?? { lender: p.lender, plans: 0, owed: 0, lastDue: debits[0] };
    row.plans += 1;
    row.owed += p.installment * debits.length;
    if (debits[debits.length - 1] > row.lastDue) row.lastDue = debits[debits.length - 1];
    map.set(p.lender, row);
  }
  return [...map.values()].sort((a, b) => b.owed - a.owed);
}

// Returns tracker: where each returned order is between "sent back" and "the lender credited it".
// The stage lives on the plan (Plan.refundStage), so Tonight and Plans read the same thing.
export type RefundStage = "returned" | "store_refunded" | "credited";

export type ReturnView = {
  plan: Plan;
  stage: RefundStage;
  daysWaiting: number;
  /** Payments the lender still has scheduled from today. */
  stillScheduled: { date: ISODate; amount: Cents }[];
  /** Waiting more than a week, or a payment comes before the credit: time for the dispute letter. */
  suggestLetter: boolean;
};

export function returnViews(state: AppState, today: ISODate): ReturnView[] {
  return state.plans
    .filter((p) => p.status === "returned")
    .map((plan) => {
      const stage: RefundStage = plan.refundStage ?? "returned";
      const daysWaiting = plan.returnedOn ? Math.max(0, diffDays(plan.returnedOn, today)) : 0;
      const stillScheduled = planDebits(plan, today).map((date) => ({ date, amount: plan.installment }));
      const soon = stillScheduled.some((d) => diffDays(today, d.date) <= 7);
      // Credited plans leave the list (the page removes them), so every plan here is still waiting.
      return { plan, stage, daysWaiting, stillScheduled, suggestLetter: daysWaiting > 7 || soon };
    })
    .sort((a, b) => b.daysWaiting - a.daysWaiting);
}

// "I moved it" on Tonight: remembered per payment (plan + date), so a reload keeps the answer.
const ACKS_KEY = "fourcast:concept:acks:v1";
export const ackKey = (planId: string, date: ISODate) => `${planId}@${date}`;

export function loadAcks(): Record<string, true> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ACKS_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAcks(next: Record<string, true>): void {
  try {
    window.localStorage.setItem(ACKS_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: the answer holds until the page closes.
  }
}
