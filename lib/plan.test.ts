// Golden cases. The jury types their own numbers and reads this file (FAQ Q96):
// every number below comes out of lib/plan.ts, nothing is hardcoded in the UI.
import { afterEach, describe, expect, it, vi } from "vitest";
import { getConceptSample, nextRisk, owedByLender } from "./concept";
import { addDays, toISODate } from "./dates";
import { keepsFacts, templateLetter } from "./dispute";
import { buildIcs } from "./ics";
import { applyCheckIn, buildTimeline, checkPurchase, debitRisks, GUARD_BUFFER, moveAmount, paydaysBetween, splitPayments, spendOn } from "./plan";
import { getSampleKlarnaPlan, getSampleState } from "./sample";
import { AppStateSchema, DisputeRequestSchema, MAX_CENTS } from "./schema";
import { loadState, saveState } from "./storage";
import type { AppState, Money } from "./types";

const TODAY = "2026-11-15";
const withKlarna = (): AppState => {
  const s = getSampleState(TODAY);
  return { ...s, plans: [...s.plans, getSampleKlarnaPlan(TODAY)] };
};

const money = (over: Partial<Money> = {}): Money => ({
  balance: 0,
  paycheck: 0,
  frequency: "biweekly",
  nextPayday: TODAY,
  rent: 0,
  rentDay: 1,
  weeklySpend: 0,
  ...over,
});
const state = (m: Money, plans: AppState["plans"] = []): AppState => ({
  version: 1,
  money: m,
  plans,
  plus: null,
  sample: false,
});

describe("demo story (opened on Nov 15, 2026)", () => {
  it("three sample plans: ok, and Guard sees no risky payment", () => {
    const s = getSampleState(TODAY);
    const t = buildTimeline(s, TODAY);
    expect(t.status).toBe("ok");
    // Lowest is the morning of Fri, Dec 4: Zip's autopay runs before the paycheck lands.
    expect(t.lowest).toMatchObject({ date: "2026-12-04", balance: 14_750, when: "morning" });
    expect(debitRisks(s, TODAY)).toEqual([]);
  });

  it("after adding Klarna: short, $12.50 below $0 on the morning of Dec 4 (same answer as Guard), $680 owed, 7 debits", () => {
    const t = buildTimeline(withKlarna(), TODAY);
    expect(t.status).toBe("short");
    expect(t.lowest).toEqual({ date: "2026-12-04", balance: -1_250, topPlanId: "sample-affirm", when: "morning" });
    expect(t.owed).toBe(68_000);
    expect(t.debitsInWindow).toBe(7);
    expect(t.paydays).toEqual(["2026-11-20", "2026-12-04", "2026-12-18"]);
    expect(t.days).toHaveLength(42);
  });

  it("Guard after adding Klarna: the Zip payment on payday morning fails, $12.50 short", () => {
    const s = withKlarna();
    expect(debitRisks(s, TODAY)).toEqual([
      {
        date: "2026-12-04",
        planId: "sample-zip",
        lender: "Zip",
        merchant: "Walmart",
        amount: 4_000,
        level: "fails",
        morning: -1_250,
        shortBy: 1_250,
        paydayLater: true,
        disputed: false,
        limit: null,
      },
    ]);
    // What's at stake: the Zip limit the person typed in (F4), never calculated.
    expect(debitRisks({ ...s, limits: { Zip: 100_000 } }, TODAY)[0].limit).toBe(100_000);
    // End of day is fine (the paycheck has landed); only the morning is short.
    const dec4 = buildTimeline(s, TODAY).days.find((d) => d.date === "2026-12-04")!;
    expect(dec4.morning).toBe(-1_250);
    expect(dec4.balance).toBeGreaterThan(0);
  });

  it("$240 in 4 today: not now, $92.50 short on Dec 3, Klarna $52.50 short that morning; fits from Sat Dec 5 = Payday Sync", () => {
    const v = checkPurchase(withKlarna(), { price: 24_000, payments: 4 }, TODAY);
    expect(v.verdict).toBe("not_now");
    expect(v.firstShort).toEqual({ date: "2026-12-03", amount: 9_250 });
    expect(v.deepest).toEqual({ date: "2026-12-03", amount: 9_250 });
    // Morning model: the purchase would make Klarna's Dec 3 autopay fail; without it Zip on Dec 4 is already short.
    expect(v.morningRisk).toEqual({ date: "2026-12-03", lender: "Klarna", merchant: "Target", shortBy: 5_250 });
    expect(v.alreadyShort).toEqual({ date: "2026-12-04", amount: 1_250, reason: "morning" });
    // Not Fri Dec 4: buying then makes Zip's failing payment that morning deeper.
    expect(v.bestDay).toBe("2026-12-05");
    expect(v.paydaySync).toEqual({
      buyOn: "2026-12-05",
      debits: ["2026-12-05", "2026-12-19", "2027-01-02", "2027-01-16"],
    });
    expect(v.fitsByDay).toHaveLength(42);
    expect(v.fitsByDay.filter((f) => f.fits)[0].date).toBe("2026-12-05");
    expect(v.schedule.map((p) => p.amount)).toEqual([6_000, 6_000, 6_000, 6_000]);
  });

  it("three sample plans alone are never short, so a purchase check has nothing to blame on them", () => {
    expect(checkPurchase(getSampleState(TODAY), { price: 24_000, payments: 4 }, TODAY).alreadyShort).toBeNull();
  });

  it("check-in on the evening of Dec 3 with $27.50: end of today is $27.50, Zip still $12.50 short (not counted twice)", () => {
    const today = "2026-12-03";
    const next = applyCheckIn(withKlarna(), 2_750, today);
    expect(buildTimeline(next, today).days[0].balance).toBe(2_750);
    expect(next.money?.balanceOn).toBe(today);
    expect(debitRisks(next, today)).toMatchObject([
      { date: "2026-12-04", lender: "Zip", level: "fails", shortBy: 1_250, paydayLater: true },
    ]);
    // Without money there is nothing to check in.
    expect(applyCheckIn({ ...next, money: null }, 2_750, today).money).toBeNull();
  });

  it("sample state passes the storage schema and its balance is dated today", () => {
    expect(AppStateSchema.safeParse(withKlarna()).success).toBe(true);
    expect(withKlarna().money?.balanceOn).toBe(TODAY);
  });
});

describe("Tonight sample (the landing's \"Try it with sample data\")", () => {
  // The usual sample + Klarna + a returned Nordstrom order on Afterpay ($40 x 1, due after the Dec 4 payday),
  // so the landing story, Tonight, Plans and Forecast all give the demo's answer.
  const s = getConceptSample(TODAY);

  it("Tonight: Zip won't clear on Fri, Dec 4, $12.50 short before the paycheck; nothing else at risk", () => {
    expect(nextRisk(s, TODAY)).toMatchObject({ date: "2026-12-04", lender: "Zip", level: "fails", shortBy: 1_250, limit: 60_000, paydayLater: true });
    expect(moveAmount(1_250)).toBe(2_500);
    expect(debitRisks(s, TODAY).map((r) => [r.date, r.lender, r.shortBy])).toEqual([["2026-12-04", "Zip", 1_250]]);
    expect(buildTimeline(s, TODAY).lowest).toMatchObject({ date: "2026-12-04", balance: -1_250, when: "morning" });
  });

  it("$240 in 4 on Tonight: not now (Klarna's Dec 3 morning would fail), already short on Dec 4; best day Sat, Dec 5 = Payday Sync", () => {
    const v = checkPurchase(s, { price: 24_000, payments: 4 }, TODAY);
    expect(v).toMatchObject({
      verdict: "not_now",
      firstShort: { date: "2026-12-03", amount: 9_250 },
      morningRisk: { date: "2026-12-03", lender: "Klarna", merchant: "Target", shortBy: 5_250 },
      alreadyShort: { date: "2026-12-04", amount: 1_250, reason: "morning" },
      bestDay: "2026-12-05",
    });
    expect(v.paydaySync?.buyOn).toBe("2026-12-05");
  });

  it("owed on Tonight equals owed on Plans and Forecast, returned orders included", () => {
    const owed = owedByLender(s, TODAY).reduce((sum, r) => sum + r.owed, 0);
    expect(owed).toBe(buildTimeline(s, TODAY).owed);
    expect(AppStateSchema.safeParse(s).success).toBe(true);
  });
});

describe("edge cases", () => {
  it("paycheck and debit on the same day: autopay hits the morning first, so it counts as short", () => {
    const s = state(money({ balance: 0, paycheck: 10_000 }), [
      { id: "p", lender: "Klarna", merchant: "", installment: 10_000, paymentsLeft: 1, nextDue: TODAY, intervalDays: 14 },
    ]);
    const t = buildTimeline(s, TODAY);
    expect(t.days[0].events.map((e) => e.kind)).toEqual(["paycheck", "debit"]);
    expect(t.days[0].balance).toBe(0);
    expect(t.days[0].morning).toBe(-10_000);
    expect(t.status).toBe("short");
  });

  it("rent on the 31st moves to the last day of a short month", () => {
    const t = buildTimeline(state(money({ balance: 200_000, rent: 100_000, rentDay: 31, nextPayday: "2027-03-01" })), "2027-02-10");
    const rentDays = t.days.filter((d) => d.events.some((e) => e.kind === "rent")).map((d) => d.date);
    expect(rentDays).toEqual(["2027-02-28"]);
  });

  it("a purchase is followed past day 42 to its last payment", () => {
    const s = state(money({ balance: 10_000 }));
    const v = checkPurchase(s, { price: 40_000, payments: 4 }, TODAY);
    // Bought on day 41: first $100 leaves $0, the second on day 55 would go $100 short.
    expect(v.fitsByDay[41].fits).toBe(false);
    expect(checkPurchase(s, { price: 8_000, payments: 4 }, TODAY).fitsByDay[41].fits).toBe(true);
  });

  it("$100 split in 3 keeps every cent", () => {
    expect(splitPayments(10_000, 3)).toEqual([3_334, 3_333, 3_333]);
    expect(splitPayments(24_000, 4)).toEqual([6_000, 6_000, 6_000, 6_000]);
  });

  it("weekly spending adds up to exactly the weekly amount", () => {
    const week = Array.from({ length: 7 }, (_, i) => spendOn(10_000, i));
    expect(week.reduce((a, b) => a + b, 0)).toBe(10_000);
  });

  it("time zones and DST never move a date", () => {
    expect(toISODate(new Date(2026, 10, 15, 23, 59))).toBe("2026-11-15");
    expect(toISODate(new Date(2026, 10, 15, 0, 1))).toBe("2026-11-15");
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("Payday Sync needs weekly or every-two-weeks pay", () => {
    const s = state(money({ balance: 500_000, paycheck: 300_000, frequency: "monthly", nextPayday: "2026-12-01" }));
    expect(checkPurchase(s, { price: 24_000, payments: 4 }, TODAY).paydaySync).toBeNull();
    const weekly = state(money({ balance: 500_000, paycheck: 80_000, frequency: "weekly", nextPayday: "2026-11-20" }));
    expect(checkPurchase(weekly, { price: 24_000, payments: 4 }, TODAY).paydaySync?.buyOn).toBe("2026-11-21");
    // Paid yesterday and nextPayday already moved two weeks on: today is the day after a payday.
    const paidYesterday = state(money({ balance: 500_000, paycheck: 80_000, nextPayday: addDays(TODAY, 13) }));
    expect(checkPurchase(paidYesterday, { price: 24_000, payments: 4 }, TODAY).paydaySync?.buyOn).toBe(TODAY);
  });

  it("semimonthly pay lands on the 15th and the last day", () => {
    const t = buildTimeline(state(money({ frequency: "semimonthly", nextPayday: "2026-11-15", paycheck: 100 })), TODAY);
    expect(t.paydays).toEqual(["2026-11-15", "2026-11-30", "2026-12-15"]);
  });

  it("semimonthly from the 15th or the end of a month: the 15th and the last day, never the 30th of a 31-day month", () => {
    const pay = (nextPayday: string) => money({ frequency: "semimonthly", nextPayday });
    expect(paydaysBetween(pay("2027-01-15"), "2027-01-01", "2027-02-28")).toEqual(["2027-01-15", "2027-01-31", "2027-02-15", "2027-02-28"]);
    expect(paydaysBetween(pay("2027-02-28"), "2027-02-01", "2027-03-31")).toEqual(["2027-02-28", "2027-03-15", "2027-03-31"]);
    expect(paydaysBetween(pay("2027-01-01"), "2027-01-01", "2027-01-31")).toEqual(["2027-01-01", "2027-01-15"]);
    // $0 in checking, Afterpay $50 on Jan 31, the paycheck lands that afternoon: the morning fails.
    const s = state(money({ frequency: "semimonthly", nextPayday: "2027-01-15", paycheck: 100_000 }), [
      { id: "a", lender: "Afterpay", merchant: "", installment: 5_000, paymentsLeft: 1, nextDue: "2027-01-31", intervalDays: 14 },
    ]);
    expect(debitRisks(s, "2027-01-20")).toMatchObject([{ date: "2027-01-31", level: "fails", shortBy: 5_000, paydayLater: true }]);
  });
});

describe("Guard: the morning model", () => {
  const plan = (id: string, installment: number, nextDue = TODAY) => ({
    id,
    lender: "Klarna" as const,
    merchant: "",
    installment,
    paymentsLeft: 1,
    nextDue,
    intervalDays: 14,
  });

  it("a debit on payday morning fails even though the end of day is fine", () => {
    const s = state(money({ balance: 0, paycheck: 10_000 }), [plan("p", 10_000)]);
    expect(buildTimeline(s, TODAY).days[0].balance).toBe(0);
    expect(debitRisks(s, TODAY)).toMatchObject([{ level: "fails", morning: -10_000, shortBy: 10_000, paydayLater: true }]);
  });

  it("two debits on one day are taken in order: the second sees what the first left", () => {
    const s = state(money({ balance: 10_000, nextPayday: "2026-12-31" }), [plan("a", 6_000), plan("b", 6_000)]);
    expect(debitRisks(s, TODAY)).toMatchObject([
      { planId: "b", level: "fails", morning: -2_000, shortBy: 2_000, paydayLater: false },
      { planId: "a", level: "tight", morning: 4_000, shortBy: 0 },
    ]);
  });

  it("tight means it clears with less than $50 left; $50 or more is safe", () => {
    const left = (balance: number) => state(money({ balance, nextPayday: "2026-12-31" }), [plan("p", 10_000)]);
    expect(debitRisks(left(10_000 + GUARD_BUFFER - 1), TODAY)).toMatchObject([{ level: "tight", morning: 4_999 }]);
    expect(debitRisks(left(10_000 + GUARD_BUFFER), TODAY)).toEqual([]);
  });

  it("rent the same morning counts before the plan payment", () => {
    const s = state(money({ balance: 120_000, rent: 100_000, rentDay: 15, nextPayday: "2026-12-31" }), [plan("p", 30_000)]);
    expect(debitRisks(s, TODAY)).toMatchObject([{ level: "fails", morning: -10_000, shortBy: 10_000 }]);
  });

  it("payments of a returned plan stay in the math and are marked disputed", () => {
    const s = state(money({ balance: 0, nextPayday: "2026-12-31" }), [{ ...plan("r", 5_000), status: "returned", returnedOn: TODAY }]);
    expect(debitRisks(s, TODAY)).toMatchObject([{ planId: "r", level: "fails", disputed: true }]);
    expect(AppStateSchema.safeParse({ ...s, limits: { Afterpay: 100_000 } }).success).toBe(true);
  });
});

describe("Before you buy: the morning model", () => {
  const afterpay = { id: "a", lender: "Afterpay" as const, merchant: "Nike", installment: 4_500, paymentsLeft: 1, nextDue: "2026-11-16", intervalDays: 14 };
  // $200 today, rent $180 today, Afterpay $45 tomorrow morning, the paycheck lands that afternoon.
  const tight = state(money({ balance: 20_000, rent: 18_000, rentDay: 15, paycheck: 100_000, nextPayday: "2026-11-16" }), [afterpay]);

  it("a purchase that makes a morning debit fail deeper does not fit, though every end of day is fine", () => {
    expect(debitRisks(tight, TODAY)).toMatchObject([{ lender: "Afterpay", level: "fails", shortBy: 2_500 }]);
    const v = checkPurchase(tight, { price: 6_000, payments: 4 }, TODAY);
    expect(v.firstShort).toBeNull();
    expect(v.verdict).toBe("not_now");
    expect(v.morningRisk).toEqual({ date: "2026-11-16", lender: "Afterpay", merchant: "Nike", shortBy: 4_000 });
    expect(v.alreadyShort).toEqual({ date: "2026-11-16", amount: 2_500, reason: "morning" });
    // Bought the day after, it no longer touches that morning.
    expect(v.bestDay).toBe("2026-11-17");
  });

  it("already short without the purchase: even $1 does not fit, and the reason is given", () => {
    const s = state(money({ balance: 1_000, weeklySpend: 5_000, nextPayday: "2027-06-01" }));
    const v = checkPurchase(s, { price: 100, payments: 4 }, TODAY);
    expect(v.verdict).toBe("not_now");
    expect(v.alreadyShort).toMatchObject({ reason: "end_of_day" });
    expect(v.alreadyShort!.date < "2026-11-18").toBe(true);
    expect(v.morningRisk).toBeNull();
  });

  it("nothing short, nothing at risk: both stay null", () => {
    const v = checkPurchase(getSampleState(TODAY), { price: 24_000, payments: 4 }, TODAY);
    expect(v).toMatchObject({ verdict: "fits", morningRisk: null, alreadyShort: null });
  });
});

describe("storage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("a 14-digit amount is refused and never wipes the saved plans", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    const good = withKlarna();
    const huge = { ...good, money: { ...good.money!, balance: 1e14 } };
    expect(AppStateSchema.safeParse(huge).success).toBe(false);
    expect(AppStateSchema.safeParse({ ...good, money: { ...good.money!, balance: MAX_CENTS } }).success).toBe(true);
    expect(saveState(good)).toBe(true);
    expect(saveState(huge)).toBe(false);
    expect(loadState()?.plans).toHaveLength(4);
    expect(loadState()?.money?.balance).toBe(92_250);
  });
});

describe("dispute letter (works without AI keys)", () => {
  const request = {
    lender: "Afterpay" as const,
    merchant: "Nike",
    installment: 5_000,
    paymentsLeft: 1,
    nextDue: "2026-11-17",
    issue: "refund_not_applied" as const,
    returnedOn: "2026-11-10",
    today: TODAY,
  };

  it("the template states only the plan's facts and leaves name and order number to the person", () => {
    const { subject, body } = templateLetter(request);
    expect(subject).toBe("Afterpay: Refund not applied to my Nike order");
    expect(body).toContain("I returned this order on Nov 10, 2026");
    expect(body).toContain("1 payment of $50.00 is still scheduled, the next one on Nov 17, 2026");
    expect(body).toContain("[Order number]");
    expect(body).toContain("[Your name]");
    expect(body).toContain("https://www.consumerfinance.gov/complaint/");
    expect(keepsFacts({ subject, body }, request)).toBe(true);
  });

  it("an AI draft with an invented amount or a dropped placeholder is not used", () => {
    const { subject, body } = templateLetter(request);
    expect(keepsFacts({ subject, body: body.replace("$50.00 is", "$500.00 is") }, request)).toBe(false);
    expect(keepsFacts({ subject, body: body.replace("[Your name]", "Jasmine") }, request)).toBe(false);
  });

  it("the request is checked: known issue, short details", () => {
    expect(DisputeRequestSchema.safeParse(request).success).toBe(true);
    expect(DisputeRequestSchema.safeParse({ ...request, issue: "lost_card" }).success).toBe(false);
    expect(DisputeRequestSchema.safeParse({ ...request, details: "x".repeat(601) }).success).toBe(false);
    // null from the UI means "not given", as for a double charge with no return date.
    const parsed = DisputeRequestSchema.safeParse({ ...request, issue: "double_charge", returnedOn: null, details: null });
    expect(parsed.success && parsed.data.returnedOn === undefined && parsed.data.details === undefined).toBe(true);
    // A paid-off plan charged twice, and a store name longer than 80 characters: still a letter, not a 400.
    const paidOff = DisputeRequestSchema.safeParse({ ...request, issue: "double_charge", paymentsLeft: 0, merchant: "N".repeat(120) });
    expect(paidOff.success && paidOff.data.merchant.length).toBe(80);
    const letter = templateLetter({ ...request, issue: "double_charge", paymentsLeft: 0 });
    expect(letter.body).toContain("No more payments are scheduled on this plan.");
    expect(keepsFacts(letter, { ...request, paymentsLeft: 0 })).toBe(true);
  });
});

describe("calendar file", () => {
  it("has a reminder the night before every debit and a check-in link", () => {
    const ics = buildIcs(withKlarna(), TODAY, "https://fourcast.example");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(7);
    // The risky Zip payment on payday morning: the reminder says what to do tonight.
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("SUMMARY:Zip takes $40.00 (Walmart): $12.50 short");
    expect(unfolded).toContain(
      "Tomorrow morning Zip takes $40.00\\, before your paycheck lands. On your numbers from Sun\\, Nov 15 you'd be $12.50 short. Move $25.00 into checking tonight\\, or pay it by hand in the Zip app after your paycheck lands.",
    );
    expect(moveAmount(1_250)).toBe(2_500);
    expect(ics).toContain("https://fourcast.example/?due=2026-12-03");
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });
});
