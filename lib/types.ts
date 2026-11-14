// Front ↔ back contract. Change it only together (see TASKS.md → «Контракт»).

/** Integer US cents: $27.50 is 2750. Only the UI formats them as dollars. */
export type Cents = number;
/** Calendar date "YYYY-MM-DD", no time zone. */
export type ISODate = string;

export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

export type Money = {
  /** In checking right now, before today's scheduled debits. */
  balance: Cents;
  /** Take-home pay per paycheck. */
  paycheck: Cents;
  frequency: PayFrequency;
  nextPayday: ISODate;
  /** 0 if there is no rent. */
  rent: Cents;
  /** 1–31; moves to the last day in shorter months. */
  rentDay: number;
  /** Everyday spending per week (groceries, gas). Spread evenly over the days. */
  weeklySpend: Cents;
};

export const LENDERS = ["Klarna", "Afterpay", "Affirm", "Zip", "PayPal", "Other"] as const;
export type Lender = (typeof LENDERS)[number];

export type Plan = {
  id: string;
  lender: Lender;
  merchant: string;
  /** Amount of each remaining payment. */
  installment: Cents;
  paymentsLeft: number;
  nextDue: ISODate;
  /** 14 for Pay in 4. */
  intervalDays: number;
};

export type Plus = {
  since: ISODate;
  trialEnds: ISODate;
  via: "stripe_test" | "demo";
};

export type AppState = {
  version: 1;
  money: Money | null;
  plans: Plan[];
  /** null → Plus answers stay behind the paywall. */
  plus: Plus | null;
  /** true when the user started from "Use sample data". */
  sample: boolean;
};

export type DayEvent =
  | { kind: "paycheck"; amount: Cents }
  | { kind: "rent"; amount: Cents }
  | { kind: "debit"; amount: Cents; planId: string; lender: Lender; merchant: string }
  | { kind: "purchase"; amount: Cents };

export type TimelineDay = {
  date: ISODate;
  /** In the order they hit the account: paycheck first, then rent and debits. */
  events: DayEvent[];
  /** Everyday spending taken that day. */
  spend: Cents;
  /** End of day. */
  balance: Cents;
};

export type Status = "ok" | "tight" | "short";

export type Timeline = {
  today: ISODate;
  /** 42 days, starting today. */
  days: TimelineDay[];
  status: Status;
  lowest: {
    date: ISODate;
    balance: Cents;
    /** The plan that takes the most between today and the lowest point (for "why"). */
    topPlanId: string | null;
  };
  /** Paydays inside the 42 days. */
  paydays: ISODate[];
  /** Everything still owed across all plans. */
  owed: Cents;
  /** Plan debits inside the 42 days. */
  debitsInWindow: number;
};

export type Purchase = {
  price: Cents;
  /** 4 for Pay in 4. */
  payments: number;
};

export type Shortfall = { date: ISODate; amount: Cents };

export type Verdict = {
  verdict: "fits" | "not_now";
  /** Payments if bought today. */
  schedule: { date: ISODate; amount: Cents }[];
  /** First day the account goes below $0 if bought today; amount is how much short. */
  firstShort: Shortfall | null;
  /** Worst day if bought today. */
  deepest: Shortfall | null;
  /** First day in the next 42 when buying never takes the account below $0. */
  bestDay: ISODate | null;
  fitsByDay: { date: ISODate; fits: boolean; lowest: Cents }[];
  /** Weekly or every-two-weeks pay only: a payday to buy on so every payment lands on a payday. */
  paydaySync: { buyOn: ISODate; debits: ISODate[] } | null;
};

export type PlanSync = { onPayday: number; total: number };

export type ReadPlanRequest = { text?: string; imageBase64?: string; today?: ISODate };
export type ReadPlanError = "no_keys" | "unreadable" | "timeout" | "too_large";
export type ReadPlanResponse =
  | { plan: Plan }
  | { error: string; code: ReadPlanError };
