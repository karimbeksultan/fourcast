// UI wording in one place (see DESIGN.md → Copy). Numbers always come from lib/plan.ts.
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import type { Lender, PayFrequency, Status, Timeline } from "@/lib/types";

export const STATUS_TITLE: Record<Status, string> = {
  ok: "You're covered.",
  tight: "It's tight.",
  short: "You'll run short.",
};

export function lowestLine(t: Timeline): string {
  const beforePayday = t.paydays.includes(addDays(t.lowest.date, 1));
  const amount = t.lowest.balance < 0 ? `${formatUSD(-t.lowest.balance)} short` : formatUSD(t.lowest.balance);
  return `Lowest point: ${amount} on ${formatShort(t.lowest.date)}${beforePayday ? ", the day before payday." : "."}`;
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
