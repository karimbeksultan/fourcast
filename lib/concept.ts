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
    paymentsLeft: 2,
    nextDue: addDays(today, 3),
    intervalDays: 14,
    status: "returned",
    returnedOn: addDays(today, -9),
  };
  return { ...base, limits: { Zip: 60_000, Klarna: 75_000 }, plans: [...base.plans, getSampleKlarnaPlan(today), returned] };
}

/** The risk to act on first: the earliest one that isn't a disputed (returned) plan. */
export function nextRisk(state: AppState, today: ISODate): DebitRisk | null {
  const risks = debitRisks(state, today).filter((r) => !r.disputed);
  return [...risks].sort((a, b) => a.date.localeCompare(b.date) || (a.level === "fails" ? -1 : 1))[0] ?? null;
}

export type LenderOwed = { lender: Lender; plans: number; owed: Cents; lastDue: ISODate };

/** What's still owed per lender, active plans only, biggest first. */
export function owedByLender(state: AppState, today: ISODate): LenderOwed[] {
  const map = new Map<Lender, LenderOwed>();
  for (const p of state.plans) {
    if (p.status === "returned") continue;
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
export type RefundStage = "returned" | "store_refunded" | "credited";
export type RefundRecord = { stage: RefundStage; storeRefundedOn?: ISODate };
const REFUNDS_KEY = "fourcast:concept:refunds:v1";

export function loadRefunds(): Record<string, RefundRecord> {
  try {
    const raw = window.localStorage.getItem(REFUNDS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveRefunds(next: Record<string, RefundRecord>): void {
  try {
    window.localStorage.setItem(REFUNDS_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: the tracker still works for this visit.
  }
}

export type ReturnView = {
  plan: Plan;
  stage: RefundStage;
  daysWaiting: number;
  /** Payments the lender still has scheduled from today. */
  stillScheduled: { date: ISODate; amount: Cents }[];
  /** Waiting more than a week, or a payment comes before the credit: time for the dispute letter. */
  suggestLetter: boolean;
};

export function returnViews(state: AppState, refunds: Record<string, RefundRecord>, today: ISODate): ReturnView[] {
  return state.plans
    .filter((p) => p.status === "returned")
    .map((plan) => {
      const stage = refunds[plan.id]?.stage ?? "returned";
      const daysWaiting = plan.returnedOn ? Math.max(0, diffDays(plan.returnedOn, today)) : 0;
      const stillScheduled = planDebits(plan, today).map((date) => ({ date, amount: plan.installment }));
      const soon = stillScheduled.some((d) => diffDays(today, d.date) <= 7);
      return { plan, stage, daysWaiting, stillScheduled, suggestLetter: stage !== "credited" && (daysWaiting > 7 || soon) };
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
