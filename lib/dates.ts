import type { ISODate } from "./types";

// All calendar math runs on "YYYY-MM-DD" strings through UTC, so a user's
// time zone or a DST switch can never move a payment to another day.

const DAY_MS = 86_400_000;

function toUTC(date: ISODate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Today's date in the user's own time zone. Call it in the browser only. */
export function toISODate(local: Date): ISODate {
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUTC(toUTC(date) + days * DAY_MS);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS);
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** The given day of a month, moved back to the last day if the month is shorter. */
export function clampedDate(year: number, month1: number, day: number): ISODate {
  const d = Math.min(day, daysInMonth(year, month1));
  return fromUTC(Date.UTC(year, month1 - 1, d));
}

export function parts(date: ISODate): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

/** "Fri, Dec 4" — US style, no time zone involved. */
export function formatShort(date: ISODate): string {
  return new Date(toUTC(date)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** "Dec 4, 2026" */
export function formatLong(date: ISODate): string {
  return new Date(toUTC(date)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "$1,234.50" from integer cents. */
export function formatUSD(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
