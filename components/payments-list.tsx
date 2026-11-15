"use client";

// Every payment across all plans, in two lists: what's already paid and what's coming up.
// No bank link: the past is inferred from each plan (see planHistory in lib/plan.ts).
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { useState } from "react";
import { formatShort, formatUSD } from "@/lib/dates";
import { planHistory } from "@/lib/plan";
import type { ISODate, PaymentRow, Plan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LENDER_MARK } from "./copy";

type Row = PaymentRow & { plan: Plan };
const SHOW = 6;

export function PaymentsList({ plans, today }: { plans: Plan[]; today: ISODate }) {
  const rows: Row[] = plans.flatMap((plan) => planHistory(plan, today).payments.map((p) => ({ ...p, plan })));
  const done = rows.filter((r) => r.status !== "upcoming" && r.status !== "today").sort((a, b) => b.date.localeCompare(a.date));
  const ahead = rows.filter((r) => r.status === "upcoming" || r.status === "today").sort((a, b) => a.date.localeCompare(b.date));
  const paidSum = done.filter((r) => r.status !== "missed").reduce((s, r) => s + r.amount, 0);
  const aheadSum = ahead.reduce((s, r) => s + r.amount, 0);

  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="payments" className="space-y-4">
      <h2 id="payments" className="text-xl font-semibold">
        Payments
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Column title="Coming up" total={aheadSum} rows={ahead} empty="Nothing left to pay." />
        <Column title="Already paid" total={paidSum} rows={done} empty="No payments yet." />
      </div>
    </section>
  );
}

function Column({ title, total, rows, empty }: { title: string; total: number; rows: Row[]; empty: string }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, SHOW);
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <p className="tabular text-sm text-muted-foreground">{formatUSD(total)}</p>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ol className="mt-3 divide-y">
          {shown.map((r) => (
            <li key={`${r.plan.id}-${r.date}`} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold" aria-hidden>
                  {LENDER_MARK[r.plan.lender]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {r.plan.lender}
                    {r.plan.merchant && <span className="font-normal text-muted-foreground">, {r.plan.merchant}</span>}
                  </span>
                  <span className={cn("flex items-center gap-1 text-xs", r.status === "missed" ? "text-short" : "text-muted-foreground")}>
                    {r.status === "missed" ? (
                      <CircleX className="size-3" aria-hidden />
                    ) : r.status === "today" ? (
                      <Clock className="size-3" aria-hidden />
                    ) : r.status !== "upcoming" ? (
                      <CircleCheck className="size-3 text-ok" aria-hidden />
                    ) : null}
                    {formatShort(r.date)}
                    {r.status === "missed" ? ", didn't go through" : r.status === "today" ? ", due today" : r.status === "before" ? ", before you added it" : ""}
                  </span>
                </span>
              </span>
              <span className={cn("tabular shrink-0", r.status === "missed" && "text-short line-through")}>{formatUSD(r.amount)}</span>
            </li>
          ))}
        </ol>
      )}
      {rows.length > SHOW && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}
