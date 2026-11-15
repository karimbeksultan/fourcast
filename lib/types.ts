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
  /** The day `balance` was typed in (start of that day). Older than today → ask to update it. Missing in data saved before v2. */
  balanceOn?: ISODate;
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
  /** 14 for Pay in 4. 30 means monthly: same day each month, by the calendar (lib/plan.ts planDate). */
  intervalDays: number;
  /** "returned": the item went back but the lender may still take the payments (F3). Missing means active. */
  status?: "active" | "returned";
  returnedOn?: ISODate;
  /** Returned plans only: the store has refunded; waiting for the lender to credit the plan. */
  refundStage?: "store_refunded";
  /** Payments in the whole plan (4 for Pay in 4). Missing: 4 for every-2-weeks plans, else paymentsLeft. */
  totalPayments?: number;
  /** Past due dates the person marked as "didn't go through". Every other past date counts as taken. */
  missed?: ISODate[];
};

export type Plus = {
  since: ISODate;
  trialEnds: ISODate;
  via: "stripe_test" | "demo";
  /** Stripe test checkout session (cs_test_…): lets /api/checkout/confirm re-check and /api/checkout/cancel cancel. */
  sessionId?: string;
};

export type AppState = {
  version: 1;
  money: Money | null;
  plans: Plan[];
  /** null → Plus answers stay behind the paywall. */
  plus: Plus | null;
  /** true when the user started from "Use sample data". */
  sample: boolean;
  /** Spending limit per lender, as the lender's app shows it (F4). Typed in, never calculated. */
  limits?: Partial<Record<Lender, Cents>>;
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
  /** Morning: yesterday's end-of-day balance minus this day's rent, plan debits and purchase, before the paycheck and spending. */
  morning: Cents;
  /** End of day. */
  balance: Cents;
};

/** A plan payment that may not go through (Guard). Lenders debit in the morning, the paycheck lands later. */
export type DebitRisk = {
  date: ISODate;
  planId: string;
  lender: Lender;
  merchant: string;
  amount: Cents;
  /** "fails": checking goes below $0 that morning. "tight": it clears but leaves less than GUARD_BUFFER. */
  level: "fails" | "tight";
  /** In checking that morning after this debit and the earlier ones that day, before the paycheck. */
  morning: Cents;
  /** How much to add before the morning so it goes through; 0 when "tight". */
  shortBy: Cents;
  /** A paycheck lands later the same day (the case from the reviews: debit at 6 am, pay at 3 pm). */
  paydayLater: boolean;
  /** The plan is marked returned, so this payment may be disputed. */
  disputed: boolean;
  /** What's at stake: the limit the person typed in for this lender (F4), or null. Never calculated. */
  limit: Cents | null;
};

export type Status = "ok" | "tight" | "short";

export type Timeline = {
  today: ISODate;
  /** 42 days, starting today. */
  days: TimelineDay[];
  status: Status;
  /** The lowest point in the window, counting each day at its lowest (morning or end of day). */
  lowest: {
    date: ISODate;
    balance: Cents;
    /** The plan that takes the most between today and the lowest point (for "why"). */
    topPlanId: string | null;
    /** "morning": the low comes after autopay, before the paycheck; "evening": at the end of the day. */
    when: "morning" | "evening";
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
  /** First day in the next 42 when buying never takes the account below $0 and no plan payment fails (deeper) that morning because of it. */
  bestDay: ISODate | null;
  fitsByDay: { date: ISODate; fits: boolean; lowest: Cents }[];
  /** Weekly or every-two-weeks pay only: the day after a payday to buy on, so every payment lands the morning after a payday. */
  paydaySync: { buyOn: ISODate; debits: ISODate[] } | null;
  /** Bought today: the first plan payment that would fail that morning because of the purchase (or fail deeper). shortBy = how short that morning. */
  morningRisk: { date: ISODate; lender: Lender; merchant: string; shortBy: Cents } | null;
  /** Without this purchase: the first day in the 42 when a plan payment fails that morning or the day ends below $0. */
  alreadyShort: { date: ISODate; amount: Cents; reason: "end_of_day" | "morning" } | null;
};

export const DISPUTE_ISSUES = ["refund_not_applied", "charged_after_cancel", "double_charge", "other"] as const;
export type DisputeIssue = (typeof DISPUTE_ISSUES)[number];

/** POST /api/dispute. Only facts of the plan: no names, order numbers or e-mails (FAQ Q26). */
export type DisputeRequest = {
  lender: Lender;
  merchant: string;
  installment: Cents;
  paymentsLeft: number;
  nextDue: ISODate;
  issue: DisputeIssue;
  returnedOn?: ISODate;
  /** A couple of lines in the user's words, at most 600 characters. */
  details?: string;
  today: ISODate;
};
export type DisputeLetter = { subject: string; body: string };
/** "rate_limited": more than 30 requests a minute from one IP (429, Retry-After in seconds). */
export type DisputeError = "bad_request" | "timeout" | "too_large" | "rate_limited";
export type DisputeResponse =
  | { letter: DisputeLetter; source: "ai" | "template" }
  | { error: string; code: DisputeError };

export type ReadPlanRequest = { text?: string; imageBase64?: string; today?: ISODate };
/** "rate_limited": more than 30 requests a minute from one IP (429, Retry-After in seconds). */
export type ReadPlanError = "no_keys" | "unreadable" | "timeout" | "too_large" | "rate_limited";
export type ReadPlanResponse =
  | { plan: Plan }
  | { error: string; code: ReadPlanError };

/**
 * One payment of a plan, past or future. Fourcast has no bank link, so the past is inferred from the plan:
 * "before" = paid before the plan was added, "taken" = its date passed (autopay), "missed" = marked as failed.
 */
export type PaymentRow = { date: ISODate; amount: Cents; status: "before" | "taken" | "missed" | "today" | "upcoming" };

export type PlanHistory = {
  payments: PaymentRow[];
  total: number;
  /** Payments counted as paid: before + taken (missed ones are not). */
  paid: number;
  paidAmount: Cents;
  totalAmount: Cents;
};
