"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatShort, formatUSD } from "@/lib/dates";
import { paydaySync, planDebits } from "@/lib/plan";
import type { AppState, ISODate, Plan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LENDER_MARK } from "./copy";

export function PlanCard({
  plan,
  state,
  today,
  onRemove,
}: {
  plan: Plan;
  state: AppState;
  today: ISODate;
  onRemove?: () => void;
}) {
  const left = planDebits(plan, today);
  const sync = paydaySync(state, plan, today);
  const allSynced = sync.total > 0 && sync.onPayday === sync.total;

  return (
    <li className="flex items-start gap-3 rounded-2xl border bg-card p-3 sm:p-4">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-payday-soft text-sm font-semibold text-accent-foreground"
        aria-hidden
      >
        {LENDER_MARK[plan.lender]}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold leading-tight">
          {plan.lender}
          {plan.merchant && <span className="font-normal text-muted-foreground">, {plan.merchant}</span>}
        </p>
        <p className="tabular text-sm">{formatUSD(plan.installment)} × {left.length} left</p>
        {left[0] && <p className="text-sm text-muted-foreground">Next {formatShort(left[0])}</p>}
        {state.money && sync.total > 0 && (
          <span
            className={cn(
              "inline-block rounded-md px-1.5 py-0.5 text-xs",
              allSynced ? "bg-payday-soft text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {allSynced ? "All on paydays" : `${sync.onPayday} of ${sync.total} on payday`}
          </span>
        )}
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove ${plan.lender} plan`}>
          <X />
        </Button>
      )}
    </li>
  );
}
