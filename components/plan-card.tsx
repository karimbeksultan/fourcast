"use client";

import { PackageX, Undo2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatShort, formatUSD } from "@/lib/dates";
import { planDebits } from "@/lib/plan";
import type { AppState, ISODate, Plan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LENDER_MARK } from "./copy";

export function PlanCard({
  plan,
  today,
  returnedOn,
  onRemove,
  onReturned,
  onUndoReturn,
}: {
  plan: Plan;
  state: AppState;
  today: ISODate;
  returnedOn?: ISODate | null;
  onRemove?: () => void;
  onReturned?: (on: ISODate) => void;
  onUndoReturn?: () => void;
}) {
  const left = planDebits(plan, today);
  const [asking, setAsking] = useState(false);
  const [on, setOn] = useState(today);

  return (
    <li className={cn("rounded-md border bg-card p-3 sm:p-4", returnedOn && "border-tight")}>
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-payday-soft text-sm font-semibold text-accent-foreground"
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
          <div className="flex flex-wrap gap-1.5">
            {returnedOn && (
              <span className="inline-block rounded-md bg-tight-soft px-1.5 py-0.5 text-xs font-medium text-tight">
                Returned {formatShort(returnedOn)} · may still be taken
              </span>
            )}
          </div>
        </div>
        {onRemove && (
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label={`Remove ${plan.lender} plan`}>
            <X />
          </Button>
        )}
      </div>

      {returnedOn ? (
        <div className="mt-3 flex flex-wrap gap-2 pl-13">
          <a
            href={`/dispute?plan=${encodeURIComponent(plan.id)}`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Write my dispute
          </a>
          {onUndoReturn && (
            <Button variant="ghost" className="h-9 text-muted-foreground" onClick={onUndoReturn}>
              <Undo2 aria-hidden />
              Not returned
            </Button>
          )}
        </div>
      ) : (
        onReturned &&
        left.length > 0 &&
        (asking ? (
          <form
            className="mt-3 flex flex-wrap items-end gap-2 pl-13"
            onSubmit={(e) => {
              e.preventDefault();
              if (/^\d{4}-\d{2}-\d{2}$/.test(on)) {
                onReturned(on);
                setAsking(false);
              }
            }}
          >
            <div className="space-y-1">
              <Label htmlFor={`ret-${plan.id}`}>Returned on</Label>
              <Input id={`ret-${plan.id}`} type="date" className="h-9 w-40" value={on} max={today} onChange={(e) => setOn(e.target.value)} />
            </div>
            <Button type="submit" className="h-9">
              Mark as returned
            </Button>
            <Button type="button" variant="ghost" className="h-9" onClick={() => setAsking(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <div className="mt-2 pl-13">
            <Button variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={() => setAsking(true)}>
              <PackageX aria-hidden />
              I returned this
            </Button>
          </div>
        ))
      )}
    </li>
  );
}
