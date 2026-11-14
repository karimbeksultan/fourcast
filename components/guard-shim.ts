// TEMPORARY (G-A1): same type and signature as LIMIT_GUARD.md §5, until Beksultan's
// `debitRisks` lands in lib/plan.ts (G-B1/G-B2). Then import from "@/lib/plan" and delete this file.
import { buildTimeline } from "@/lib/plan";
import type { AppState, Cents, ISODate, Lender } from "@/lib/types";

export const GUARD_BUFFER: Cents = 5_000;

export type DebitRisk = {
  date: ISODate;
  planId: string;
  lender: Lender;
  merchant: string;
  amount: Cents;
  level: "fails" | "tight";
  morning: Cents;
  shortBy: Cents;
  paydayLater: boolean;
  disputed: boolean;
};

/** Morning rule: lenders debit before the paycheck lands, so each debit is checked against what's left from yesterday. */
export function debitRisks(state: AppState, today: ISODate, returned: Record<string, ISODate> = {}): DebitRisk[] {
  if (!state.money) return [];
  const days = buildTimeline(state, today).days;
  const out: DebitRisk[] = [];
  days.forEach((day, i) => {
    let morning = i === 0 ? state.money!.balance : days[i - 1].balance;
    const paydayLater = day.events.some((e) => e.kind === "paycheck");
    for (const e of day.events) {
      if (e.kind === "rent") morning -= e.amount;
      if (e.kind !== "debit") continue;
      morning -= e.amount;
      if (morning < 0 || morning < GUARD_BUFFER) {
        out.push({
          date: day.date,
          planId: e.planId,
          lender: e.lender,
          merchant: e.merchant,
          amount: e.amount,
          level: morning < 0 ? "fails" : "tight",
          morning,
          shortBy: morning < 0 ? -morning : 0,
          paydayLater,
          disputed: Boolean(returned[e.planId]),
        });
      }
    }
  });
  return out.sort((a, b) => (a.level === b.level ? a.date.localeCompare(b.date) : a.level === "fails" ? -1 : 1));
}
