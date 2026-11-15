"use client";

import { CircleCheck, CircleDashed, CircleX, Clock, PackageX, Undo2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatShort, formatUSD } from "@/lib/dates";
import { planDebits, planHistory } from "@/lib/plan";
import type { AppState, ISODate, PaymentRow, Plan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LENDER_MARK } from "./copy";

export function PlanCard({
  plan,
  today,
  returnedOn,
  onRemove,
  onReturned,
  onUndoReturn,
  onMissed,
}: {
  /** Mark a past payment as "didn't go through" (true) or back to taken (false). */
  onMissed?: (date: ISODate, missed: boolean) => void;
  plan: Plan;
  state: AppState;
  today: ISODate;
  returnedOn?: ISODate | null;
  onRemove?: () => void;
  onReturned?: (on: ISODate) => void;
  onUndoReturn?: () => void;
}) {
  const left = planDebits(plan, today);
  const history = planHistory(plan, today);
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
          <Progress paid={history.paid} total={history.total} paidAmount={history.paidAmount} totalAmount={history.totalAmount} />
          <div className="flex flex-wrap gap-1.5">
            {returnedOn && (
              <span className="inline-block rounded-md bg-tight-soft px-1.5 py-0.5 text-xs font-medium text-tight">
                Returned {formatShort(returnedOn)}
                {plan.refundStage === "store_refunded" ? ", store refunded" : ""}, may still be taken
              </span>
            )}
          </div>
        </div>
        {onRemove && (
          <Button variant="ghost" size="icon" className="size-11" onClick={onRemove} aria-label={`Remove ${plan.lender} plan`}>
            <X />
          </Button>
        )}
      </div>

      <details className="group mt-2 pl-13">
        <summary className="cursor-pointer py-3 text-sm font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Payment history
        </summary>
        <ol className="mt-2 space-y-1" aria-label={`${plan.lender} payments`}>
          {history.payments.map((p) => (
            <HistoryRow key={p.date} row={p} lender={plan.lender} onMissed={onMissed} />
          ))}
        </ol>
        {history.payments.some((p) => p.status === "before") && (
          <p className="mt-2 text-xs text-muted-foreground">
            Earlier payments are inferred: Fourcast doesn&apos;t see your bank, so a passed date counts as paid unless you mark it.
          </p>
        )}
      </details>

      {returnedOn ? (
        <div className="mt-3 flex flex-wrap gap-2 pl-13">
          <a
            href={`/dispute?plan=${encodeURIComponent(plan.id)}`}
            className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Write my dispute
          </a>
          {onUndoReturn && (
            <Button variant="ghost" className="h-11 text-muted-foreground" onClick={onUndoReturn}>
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
              <Input id={`ret-${plan.id}`} type="date" className="h-11 w-40" value={on} max={today} onChange={(e) => setOn(e.target.value)} />
            </div>
            <Button type="submit" className="h-11">
              Mark as returned
            </Button>
            <Button type="button" variant="ghost" className="h-11" onClick={() => setAsking(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <div className="mt-2 pl-13">
            <Button variant="ghost" className="h-11 px-2 text-muted-foreground" onClick={() => setAsking(true)}>
              <PackageX aria-hidden />
              I returned this
            </Button>
          </div>
        ))
      )}
    </li>
  );
}

function Progress({ paid, total, paidAmount, totalAmount }: { paid: number; total: number; paidAmount: number; totalAmount: number }) {
  return (
    <div className="pt-1">
      <p className="tabular text-sm">
        <span className="font-semibold">
          {paid} of {total} paid
        </span>
        <span className="text-muted-foreground">
          , {formatUSD(paidAmount)} of {formatUSD(totalAmount)}
        </span>
      </p>
      <div className="mt-1 flex gap-1" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < paid ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
    </div>
  );
}

const ROW: Record<PaymentRow["status"], { label: string; icon: typeof CircleCheck; tone: string }> = {
  before: { label: "Paid before you added it", icon: CircleCheck, tone: "text-ok" },
  taken: { label: "Taken by autopay", icon: CircleCheck, tone: "text-ok" },
  missed: { label: "Didn't go through", icon: CircleX, tone: "text-short" },
  today: { label: "Due today", icon: Clock, tone: "text-tight" },
  upcoming: { label: "Coming up", icon: CircleDashed, tone: "text-muted-foreground" },
};

function HistoryRow({
  row,
  lender,
  onMissed,
}: {
  row: PaymentRow;
  lender: string;
  onMissed?: (date: ISODate, missed: boolean) => void;
}) {
  const s = ROW[row.status];
  const canMark = onMissed && (row.status === "taken" || row.status === "missed");
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
      <span className="flex items-center gap-2">
        <s.icon className={cn("size-4 shrink-0", s.tone)} aria-hidden />
        <span className="tabular w-24">{formatShort(row.date)}</span>
        <span className={cn(row.status === "upcoming" && "text-muted-foreground", row.status === "missed" && "text-short")}>{s.label}</span>
      </span>
      <span className="flex items-center gap-3">
        {canMark && (
          <button
            type="button"
            onClick={() => onMissed(row.date, row.status === "taken")}
            className="text-xs font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {row.status === "taken" ? "Didn't go through?" : "It went through"}
          </button>
        )}
        <span className={cn("tabular", row.status === "upcoming" && "text-muted-foreground")}>{formatUSD(row.amount)}</span>
      </span>
      {row.status === "missed" && (
        <span className="w-full pl-6 text-xs text-short">Pay it in the {lender} app before they retry, so it doesn&apos;t count as late.</span>
      )}
    </li>
  );
}
