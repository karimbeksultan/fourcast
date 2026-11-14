// The core of Fourcast: plain, deterministic money math. No AI here.
// Rules (golden cases in lib/plan.test.ts and demo_inputs.md):
// - Dates are "YYYY-MM-DD" strings, money is integer cents.
// - `today` always comes from the caller (the browser), never from the server clock.
// - Balances are end of day. On a day with a paycheck and a debit, the paycheck lands first.
// - Guard uses the morning instead: lenders debit in the morning, the paycheck lands in the
//   afternoon. morning = yesterday's end-of-day balance minus today's rent and plan debits, in order.
// - Everyday spending is spread evenly: exactly `weeklySpend` every 7 days.
import { addDays, clampedDate, diffDays, parts } from "./dates";
import type {
  AppState,
  Cents,
  DayEvent,
  DebitRisk,
  ISODate,
  Money,
  Plan,
  PlanSync,
  Purchase,
  Shortfall,
  Status,
  Timeline,
  TimelineDay,
  Verdict,
} from "./types";

export const WINDOW_DAYS = 42;
/** Below this lowest balance the timeline says "tight". */
export const TIGHT_BELOW: Cents = 10_000;
export const PAY_IN_4_INTERVAL = 14;
/** A debit that clears but leaves less than this in checking that morning is "tight": one card swipe and it fails. */
export const GUARD_BUFFER: Cents = 5_000;

// ---------- schedules ----------

function nextMonth(year: number, month: number): [number, number] {
  return month === 12 ? [year + 1, 1] : [year, month + 1];
}

/** Paydays between `from` and `to`, inclusive. */
export function paydaysBetween(money: Money | null, from: ISODate, to: ISODate): ISODate[] {
  if (!money || to < from) return [];
  const anchor = money.nextPayday;
  const lower = anchor > from ? anchor : from;
  const out: ISODate[] = [];

  if (money.frequency === "weekly" || money.frequency === "biweekly") {
    const step = money.frequency === "weekly" ? 7 : 14;
    const behind = diffDays(anchor, lower);
    let d = addDays(anchor, Math.ceil(Math.max(0, behind) / step) * step);
    while (d <= to) {
      out.push(d);
      d = addDays(d, step);
    }
    return out;
  }

  const day = parts(anchor).day;
  const days =
    money.frequency === "monthly" ? [day] : day <= 15 ? [day, day + 15] : [day - 15, day];
  let { year, month } = parts(lower);
  while (clampedDate(year, month, 1) <= to) {
    for (const d of days) {
      const date = clampedDate(year, month, d);
      if (date >= lower && date <= to && !out.includes(date)) out.push(date);
    }
    [year, month] = nextMonth(year, month);
  }
  return out.sort();
}

export function rentDatesBetween(money: Money | null, from: ISODate, to: ISODate): ISODate[] {
  if (!money || money.rent <= 0 || to < from) return [];
  const out: ISODate[] = [];
  let { year, month } = parts(from);
  while (clampedDate(year, month, 1) <= to) {
    const date = clampedDate(year, month, money.rentDay);
    if (date >= from && date <= to) out.push(date);
    [year, month] = nextMonth(year, month);
  }
  return out;
}

/** Remaining debit dates of a plan, on or after `from`. */
export function planDebits(plan: Plan, from: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let k = 0; k < plan.paymentsLeft; k++) {
    const date = addDays(plan.nextDue, k * plan.intervalDays);
    if (date >= from) out.push(date);
  }
  return out;
}

/** Splits a price into payments; the leftover cents go to the first one ($100 / 3 → 33.34, 33.33, 33.33). */
export function splitPayments(price: Cents, count: number): Cents[] {
  const n = Math.max(1, Math.floor(count));
  const base = Math.floor(price / n);
  const rest = price - base * n;
  return Array.from({ length: n }, (_, i) => (i === 0 ? base + rest : base));
}

/** Everyday spending on day `index` (0 = today): exactly `weekly` cents per 7 days. */
export function spendOn(weekly: Cents, index: number): Cents {
  return Math.floor(((index + 1) * weekly) / 7) - Math.floor((index * weekly) / 7);
}

// ---------- simulation ----------

const ORDER: Record<DayEvent["kind"], number> = { paycheck: 0, rent: 1, debit: 2, purchase: 3 };

function simulate(
  state: AppState,
  today: ISODate,
  length: number,
  extra: { date: ISODate; amount: Cents }[] = [],
): TimelineDay[] {
  const money = state.money;
  const end = addDays(today, length - 1);
  const byDate = new Map<ISODate, DayEvent[]>();
  const add = (date: ISODate, event: DayEvent) => {
    if (date < today || date > end) return;
    const list = byDate.get(date);
    if (list) list.push(event);
    else byDate.set(date, [event]);
  };

  if (money) {
    for (const d of paydaysBetween(money, today, end)) add(d, { kind: "paycheck", amount: money.paycheck });
    for (const d of rentDatesBetween(money, today, end)) add(d, { kind: "rent", amount: money.rent });
  }
  for (const plan of state.plans) {
    for (const d of planDebits(plan, today)) {
      add(d, { kind: "debit", amount: plan.installment, planId: plan.id, lender: plan.lender, merchant: plan.merchant });
    }
  }
  for (const x of extra) add(x.date, { kind: "purchase", amount: x.amount });

  let balance = money?.balance ?? 0;
  const days: TimelineDay[] = [];
  for (let i = 0; i < length; i++) {
    const date = addDays(today, i);
    const events = (byDate.get(date) ?? []).sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
    const morning = events.reduce((m, e) => (e.kind === "paycheck" ? m : m - e.amount), balance);
    for (const e of events) balance += e.kind === "paycheck" ? e.amount : -e.amount;
    const spend = spendOn(money?.weeklySpend ?? 0, i);
    balance -= spend;
    days.push({ date, events, spend, morning, balance });
  }
  return days;
}

/** The lowest the account gets that day: the morning (after autopay, before the paycheck) or the end of the day. */
export function dayLow(day: TimelineDay): Cents {
  return Math.min(day.morning, day.balance);
}

function statusOf(lowest: Cents): Status {
  if (lowest < 0) return "short";
  if (lowest < TIGHT_BELOW) return "tight";
  return "ok";
}

// ---------- contract ----------

export function buildTimeline(state: AppState, today: ISODate): Timeline {
  const days = simulate(state, today, WINDOW_DAYS);
  let low = 0;
  // One model everywhere (Guard, Tonight, Forecast): a day counts at its lowest, which is often the morning.
  for (let i = 1; i < days.length; i++) if (dayLow(days[i]) < dayLow(days[low])) low = i;

  const pull = new Map<string, Cents>();
  for (let i = 0; i <= low; i++) {
    for (const e of days[i].events) {
      if (e.kind === "debit") pull.set(e.planId, (pull.get(e.planId) ?? 0) + e.amount);
    }
  }
  let topPlanId: string | null = null;
  for (const [id, amount] of pull) if (topPlanId === null || amount > pull.get(topPlanId)!) topPlanId = id;

  const end = days[days.length - 1].date;
  return {
    today,
    days,
    status: statusOf(dayLow(days[low])),
    lowest: {
      date: days[low].date,
      balance: dayLow(days[low]),
      topPlanId,
      when: days[low].morning < days[low].balance ? "morning" : "evening",
    },
    paydays: paydaysBetween(state.money, today, end),
    owed: state.plans.reduce((sum, p) => sum + p.installment * planDebits(p, today).length, 0),
    debitsInWindow: days.reduce((n, d) => n + d.events.filter((e) => e.kind === "debit").length, 0),
  };
}

/**
 * Evening check-in: the person types what is in checking now, at the end of today.
 * Money.balance is the start of today, so today's rent, plan debits and spending are added back
 * (and today's paycheck taken out): the end of today then equals what they typed. Sets balanceOn = today.
 */
export function applyCheckIn(state: AppState, eveningBalance: Cents, today: ISODate): AppState {
  if (!state.money) return state;
  const endOfToday = simulate(state, today, 1)[0].balance;
  const balance = eveningBalance + (state.money.balance - endOfToday);
  return { ...state, money: { ...state.money, balance, balanceOn: today } };
}

export function checkPurchase(state: AppState, purchase: Purchase, today: ISODate): Verdict {
  const amounts = splitPayments(purchase.price, purchase.payments);
  const interval = PAY_IN_4_INTERVAL;
  const span = interval * (amounts.length - 1);
  // Long enough that a purchase started on day 41 is followed to its last payment.
  const length = WINDOW_DAYS + span;
  const base = simulate(state, today, length);

  // How much of the purchase is paid by day `d` if bought on day `s`.
  const paidBy = (s: number, d: number) => {
    let paid = 0;
    for (let k = 0; k < amounts.length && s + k * interval <= d; k++) paid += amounts[k];
    return paid;
  };

  const fitsByDay: Verdict["fitsByDay"] = [];
  for (let s = 0; s < WINDOW_DAYS; s++) {
    let lowest = Infinity;
    for (let d = s; d < length; d++) lowest = Math.min(lowest, base[d].balance - paidBy(s, d));
    fitsByDay.push({ date: base[s].date, fits: lowest >= 0, lowest });
  }

  let firstShort: Shortfall | null = null;
  let deepest: Shortfall | null = null;
  for (let d = 0; d < length; d++) {
    const balance = base[d].balance - paidBy(0, d);
    if (balance >= 0) continue;
    if (!firstShort) firstShort = { date: base[d].date, amount: -balance };
    if (!deepest || -balance > deepest.amount) deepest = { date: base[d].date, amount: -balance };
  }

  const scheduleFrom = (s: ISODate) => amounts.map((amount, k) => ({ date: addDays(s, k * interval), amount }));

  // Buy the day after a payday: with weekly or every-two-weeks pay, every later payment then
  // lands the morning after a payday, when the paycheck is already in checking.
  let paydaySync: Verdict["paydaySync"] = null;
  const money = state.money;
  if (money && (money.frequency === "weekly" || money.frequency === "biweekly")) {
    const dayAfter = new Set(paydaysBetween(money, addDays(today, -1), addDays(today, WINDOW_DAYS - 2)).map((d) => addDays(d, 1)));
    const hit = fitsByDay.find((f) => f.fits && dayAfter.has(f.date));
    if (hit) paydaySync = { buyOn: hit.date, debits: scheduleFrom(hit.date).map((p) => p.date) };
  }

  return {
    verdict: fitsByDay[0].fits ? "fits" : "not_now",
    schedule: scheduleFrom(today),
    firstShort,
    deepest,
    bestDay: fitsByDay.find((f) => f.fits)?.date ?? null,
    fitsByDay,
    paydaySync,
  };
}

/** What to move into checking the night before a failing debit: the shortfall plus $10, rounded up to $5 ($12.50 → $25). */
export function moveAmount(shortBy: Cents): Cents {
  return Math.ceil((shortBy + 1_000) / 500) * 500;
}

/**
 * Guard: plan payments in the next 42 days that may not go through. Each debit is checked against the
 * morning (yesterday's end-of-day balance minus this day's rent and earlier debits, before the paycheck).
 * "fails" below $0, "tight" below GUARD_BUFFER. Safe debits are left out. Order: fails first, then by date.
 */
export function debitRisks(state: AppState, today: ISODate): DebitRisk[] {
  if (!state.money) return [];
  const returned = new Set(state.plans.filter((p) => p.status === "returned").map((p) => p.id));
  const days = simulate(state, today, WINDOW_DAYS);
  const risks: DebitRisk[] = [];

  days.forEach((day, i) => {
    let morning = i === 0 ? state.money!.balance : days[i - 1].balance;
    const paydayLater = day.events.some((e) => e.kind === "paycheck");
    for (const e of day.events) {
      if (e.kind === "paycheck") continue;
      morning -= e.amount;
      if (e.kind !== "debit" || morning >= GUARD_BUFFER) continue;
      risks.push({
        date: day.date,
        planId: e.planId,
        lender: e.lender,
        merchant: e.merchant,
        amount: e.amount,
        level: morning < 0 ? "fails" : "tight",
        morning,
        shortBy: morning < 0 ? -morning : 0,
        paydayLater,
        disputed: returned.has(e.planId),
        limit: state.limits?.[e.lender] ?? null,
      });
    }
  });

  const rank = { fails: 0, tight: 1 } as const;
  return risks.sort((a, b) => rank[a.level] - rank[b.level] || a.date.localeCompare(b.date));
}

/** How many of a plan's remaining debits land on a payday (badge on the plan card). */
export function paydaySync(state: AppState, plan: Plan, today: ISODate): PlanSync {
  const debits = planDebits(plan, today);
  if (debits.length === 0) return { onPayday: 0, total: 0 };
  const paydays = new Set(paydaysBetween(state.money, today, debits[debits.length - 1]));
  return { onPayday: debits.filter((d) => paydays.has(d)).length, total: debits.length };
}
