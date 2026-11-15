// UI wording in one place (see DESIGN.md → Copy). Numbers always come from lib/plan.ts.
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import type { Lender, PayFrequency, Status, Timeline, Verdict } from "@/lib/types";

export const STATUS_TITLE: Record<Status, string> = {
  ok: "You're covered.",
  tight: "It's tight.",
  short: "You'll run short.",
};

export function lowestLine(t: Timeline): string {
  const beforePayday = t.paydays.includes(addDays(t.lowest.date, 1));
  const amount = t.lowest.balance < 0 ? `${formatUSD(-t.lowest.balance)} short` : formatUSD(t.lowest.balance);
  const paydaySameDay = t.paydays.includes(t.lowest.date);
  const tail =
    t.lowest.when === "morning"
      ? paydaySameDay
        ? ", in the morning before your paycheck lands."
        : ", in the morning after autopay."
      : beforePayday
        ? ", the day before payday."
        : ".";
  return `Lowest point: ${amount} on ${formatShort(t.lowest.date)}${tail}`;
}

export const LENDER_MARK: Record<Lender, string> = {
  Klarna: "K",
  Afterpay: "A",
  Affirm: "Af",
  Zip: "Z",
  PayPal: "P",
  Other: "•",
};

export const FREQUENCY_LABEL: Record<PayFrequency, string> = {
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  semimonthly: "Twice a month",
  monthly: "Once a month",
};

/** "$12.30" → 1230 cents; null if it isn't a number. */
export function toCents(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, "");
  if (clean === "" || !/^-?\d*\.?\d{0,2}$/.test(clean)) return null;
  const value = Number(clean);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

export function toDollars(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

/**
 * The free line under a purchase verdict. It never blames the buy for a shortfall that is already there:
 * with a $1 buy and a short morning ahead, it says so instead of "would take you below $0".
 */
export function verdictLine(v: Verdict): string {
  if (v.verdict === "fits") return "Buying today keeps you above $0 for the next 6 weeks.";
  const already = v.alreadyShort;
  if (already && (!v.firstShort || already.date <= v.firstShort.date)) {
    return `You're already ${formatUSD(already.amount)} short on ${formatShort(already.date)} without this buy. Sort that out first.`;
  }
  const first = v.firstShort ? ` on ${formatShort(v.firstShort.date)}` : "";
  const also = already ? `, and you're already short on ${formatShort(already.date)}` : "";
  return `Buying today would take you below $0${first}${also}.`;
}

/**
 * The plan payment this buy would knock over, by name: the purchase's own first payment comes out today,
 * and a payment already scheduled then fails on its morning. null when the buy fits or nothing is hit.
 */
export function morningRiskLine(v: Verdict): string | null {
  const m = v.morningRisk;
  if (v.verdict === "fits" || !m) return null;
  return `${m.lender}${m.merchant ? ` · ${m.merchant}` : ""} on ${formatShort(m.date)} would be ${formatUSD(m.shortBy)} short that morning.`;
}
