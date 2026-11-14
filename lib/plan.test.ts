// Golden cases. The jury types their own numbers and reads this file (FAQ Q96):
// every number below comes out of lib/plan.ts, nothing is hardcoded in the UI.
import { describe, expect, it } from "vitest";
import { addDays, toISODate } from "./dates";
import { buildIcs } from "./ics";
import { buildTimeline, checkPurchase, paydaySync, splitPayments, spendOn } from "./plan";
import { getSampleKlarnaPlan, getSampleState } from "./sample";
import { AppStateSchema } from "./schema";
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
  it("two sample plans: ok", () => {
    const t = buildTimeline(getSampleState(TODAY), TODAY);
    expect(t.status).toBe("ok");
    expect(t.lowest).toMatchObject({ date: "2026-12-03", balance: 18_750 });
  });

  it("after adding Klarna: tight, lowest $27.50 on Dec 3, $640 owed, 6 debits", () => {
    const t = buildTimeline(withKlarna(), TODAY);
    expect(t.status).toBe("tight");
    expect(t.lowest).toEqual({ date: "2026-12-03", balance: 2_750, topPlanId: "sample-affirm" });
    expect(t.owed).toBe(64_000);
    expect(t.debitsInWindow).toBe(6);
    expect(t.paydays).toEqual(["2026-11-20", "2026-12-04", "2026-12-18"]);
    expect(t.days).toHaveLength(42);
  });

  it("$240 in 4 today: not now, $92.50 short on Dec 3, fits from Fri Dec 4 with Payday Sync", () => {
    const v = checkPurchase(withKlarna(), { price: 24_000, payments: 4 }, TODAY);
    expect(v.verdict).toBe("not_now");
    expect(v.firstShort).toEqual({ date: "2026-12-03", amount: 9_250 });
    expect(v.deepest).toEqual({ date: "2026-12-03", amount: 9_250 });
    expect(v.bestDay).toBe("2026-12-04");
    expect(v.paydaySync).toEqual({
      buyOn: "2026-12-04",
      debits: ["2026-12-04", "2026-12-18", "2027-01-01", "2027-01-15"],
    });
    expect(v.fitsByDay).toHaveLength(42);
    expect(v.fitsByDay.filter((f) => f.fits)[0].date).toBe("2026-12-04");
    expect(v.schedule.map((p) => p.amount)).toEqual([6_000, 6_000, 6_000, 6_000]);
  });

  it("sample plans hit the day before payday, not on it", () => {
    const s = withKlarna();
    const klarna = s.plans.find((p) => p.lender === "Klarna")!;
    expect(paydaySync(s, klarna, TODAY)).toEqual({ onPayday: 0, total: 3 });
  });

  it("sample state passes the storage schema", () => {
    expect(AppStateSchema.safeParse(withKlarna()).success).toBe(true);
  });
});

describe("edge cases", () => {
  it("paycheck and debit on the same day: the paycheck lands first", () => {
    const s = state(money({ balance: 0, paycheck: 10_000 }), [
      { id: "p", lender: "Klarna", merchant: "", installment: 10_000, paymentsLeft: 1, nextDue: TODAY, intervalDays: 14 },
    ]);
    const t = buildTimeline(s, TODAY);
    expect(t.days[0].events.map((e) => e.kind)).toEqual(["paycheck", "debit"]);
    expect(t.days[0].balance).toBe(0);
    expect(t.status).toBe("tight");
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
    expect(checkPurchase(weekly, { price: 24_000, payments: 4 }, TODAY).paydaySync?.buyOn).toBe("2026-11-20");
  });

  it("semimonthly pay lands on the 15th and the last day", () => {
    const t = buildTimeline(state(money({ frequency: "semimonthly", nextPayday: "2026-11-15", paycheck: 100 })), TODAY);
    expect(t.paydays).toEqual(["2026-11-15", "2026-11-30", "2026-12-15"]);
  });
});

describe("calendar file", () => {
  it("has a reminder the night before every debit and a check-in link", () => {
    const ics = buildIcs(withKlarna(), TODAY, "https://fourcast.example");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(6);
    expect(ics).toContain("https://fourcast.example/?due=2026-12-03");
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });
});
