"use client";

// Secondary blocks: what's owed per lender (with "I sent it back"), and a one-line check before a new buy.
import { PackageOpen } from "lucide-react";
import { useState } from "react";
import { LENDER_MARK, toCents, verdictLine } from "@/components/copy";
import { formatShort, formatUSD } from "@/lib/dates";
import type { LenderOwed } from "@/lib/concept";
import { checkPurchase, planDebits } from "@/lib/plan";
import type { AppState, ISODate, Plan } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OwedSummary({
  rows,
  plans,
  today,
  onReturned,
}: {
  rows: LenderOwed[];
  plans: Plan[];
  today: ISODate;
  onReturned: (planId: string) => void;
}) {
  const total = rows.reduce((s, r) => s + r.owed, 0);
  const last = rows.reduce<ISODate | null>((m, r) => (m === null || r.lastDue > m ? r.lastDue : m), null);
  const active = plans.filter((p) => p.status !== "returned");
  const onReturns = plans
    .filter((p) => p.status === "returned")
    .reduce((sum, p) => sum + p.installment * planDebits(p, today).length, 0);

  return (
    <section aria-labelledby="owed-title" className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <div>
        <h2 id="owed-title" className="text-xl font-semibold">
          Everything you owe
        </h2>
        <p className="mt-1 text-muted-foreground">
          <span className="tabular text-2xl font-bold text-foreground">{formatUSD(total)}</span>
          {last && <> across {rows.length} lender{rows.length === 1 ? "" : "s"}, all paid by {formatShort(last)}</>}
        </p>
        {onReturns > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Includes <span className="tabular">{formatUSD(onReturns)}</span> still scheduled on returned orders.
          </p>
        )}
      </div>

      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.lender} className="flex items-center justify-between gap-3 py-2">
            <span className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-md bg-muted text-xs font-semibold" aria-hidden>
                {LENDER_MARK[r.lender]}
              </span>
              <span>
                {r.lender}
                <span className="block text-xs text-muted-foreground">
                  {r.plans} plan{r.plans === 1 ? "" : "s"}, last {formatShort(r.lastDue)}
                </span>
              </span>
            </span>
            <span className="tabular font-semibold">{formatUSD(r.owed)}</span>
          </li>
        ))}
      </ul>

      {active.length > 0 && (
        <details className="group text-sm">
          <summary className="cursor-pointer py-3 font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Sent something back?
          </summary>
          <ul className="mt-2 space-y-1">
            {active.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span>
                  {p.lender}, {p.merchant} <span className="tabular text-muted-foreground">{formatUSD(p.installment)} × {p.paymentsLeft}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onReturned(p.id)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <PackageOpen className="size-3.5" aria-hidden /> I sent it back
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Today is {formatShort(today)}. We start counting the wait from today.</p>
        </details>
      )}
    </section>
  );
}

export function QuickCheck({ state, today }: { state: AppState; today: ISODate }) {
  const [price, setPrice] = useState("");
  const cents = toCents(price);
  const verdict = cents && cents > 0 ? checkPurchase(state, { price: cents, payments: 4 }, today) : null;

  return (
    <section aria-labelledby="check-title" className="space-y-3 rounded-lg border bg-card p-4 sm:p-5">
      <h2 id="check-title" className="text-xl font-semibold">
        Before you buy
      </h2>
      <label className="block text-sm" htmlFor="quick-price">
        Price of a new Pay in 4
      </label>
      <input
        id="quick-price"
        inputMode="decimal"
        placeholder="$240"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-base tabular outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {verdict && (
        <div className={cn("rounded-md p-3", verdict.verdict === "fits" ? "bg-ok-soft" : "bg-short-soft")} aria-live="polite">
          <p className="font-semibold">{verdict.verdict === "fits" ? "It fits." : "Not right now."}</p>
          {/* Free answer only; the day it fits is a Plus answer on /check, same as everywhere else. */}
          <p className="text-sm">{verdictLine(verdict)}</p>
        </div>
      )}
      <a
        href="/check"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Full check with Payday Sync
      </a>
    </section>
  );
}
