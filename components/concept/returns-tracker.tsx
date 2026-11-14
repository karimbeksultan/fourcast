"use client";

// Money stuck in returns: where each returned order is, what the lender still plans to take, and when to push.
import { Check, FileText, PackageCheck, Store, Wallet } from "lucide-react";
import Link from "next/link";
import { formatShort, formatUSD } from "@/lib/dates";
import type { RefundStage, ReturnView } from "@/lib/concept";
import { cn } from "@/lib/utils";

const STEPS: { stage: RefundStage; label: string; icon: typeof Store }[] = [
  { stage: "returned", label: "You sent it back", icon: PackageCheck },
  { stage: "store_refunded", label: "Store refunded", icon: Store },
  { stage: "credited", label: "Lender credited", icon: Wallet },
];
const ORDER: RefundStage[] = ["returned", "store_refunded", "credited"];

export function ReturnsTracker({
  views,
  onStage,
}: {
  views: ReturnView[];
  onStage: (planId: string, stage: RefundStage) => void;
}) {
  const stuck = views.filter((v) => v.stage !== "credited");
  const total = stuck.reduce((s, v) => s + v.stillScheduled.reduce((a, d) => a + d.amount, 0), 0);

  return (
    <section aria-labelledby="returns-title" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="returns-title" className="text-xl font-semibold">
          Money in returns
        </h2>
        {stuck.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="tabular font-semibold text-foreground">{formatUSD(total)}</span> still scheduled on returned orders
          </p>
        )}
      </div>

      {views.length === 0 ? (
        <p className="rounded-lg border bg-card p-4 text-muted-foreground">
          Returned something? Mark the plan below with &quot;I sent it back&quot; and we&apos;ll follow the refund until the lender credits it.
        </p>
      ) : (
        <ul className="space-y-3">
          {views.map((v) => {
            const at = ORDER.indexOf(v.stage);
            const next = v.stillScheduled[0];
            return (
              <li key={v.plan.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    {v.plan.merchant} <span className="font-normal text-muted-foreground">with {v.plan.lender}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.stage === "credited" ? "Closed" : `Waiting ${v.daysWaiting} day${v.daysWaiting === 1 ? "" : "s"}`}
                  </p>
                </div>

                <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Refund progress">
                  {STEPS.map((s, i) => {
                    const reached = i <= at;
                    const Icon = reached ? Check : s.icon;
                    return (
                      <li key={s.stage} className="flex flex-col gap-2">
                        <span className={cn("h-1.5 rounded-full", reached ? "bg-primary" : "bg-muted")} aria-hidden />
                        <span className={cn("flex items-center gap-1.5 text-sm", reached ? "font-semibold" : "text-muted-foreground")}>
                          <Icon className="size-4 shrink-0" aria-hidden />
                          {s.label}
                          <span className="sr-only">{reached ? ", done" : ", not yet"}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                {v.stage !== "credited" && next && (
                  <p className="mt-4 text-sm">
                    {v.plan.lender} still plans to take <span className="tabular font-semibold">{formatUSD(next.amount)}</span> on{" "}
                    {formatShort(next.date)}
                    {v.stillScheduled.length > 1 ? ` and ${v.stillScheduled.length - 1} more after it` : ""}. Report the return in the{" "}
                    {v.plan.lender} app so they pause it while they check.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {v.stage === "returned" && (
                    <button
                      type="button"
                      onClick={() => onStage(v.plan.id, "store_refunded")}
                      className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      The store refunded me
                    </button>
                  )}
                  {v.stage === "store_refunded" && (
                    <button
                      type="button"
                      onClick={() => onStage(v.plan.id, "credited")}
                      className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {v.plan.lender} credited it
                    </button>
                  )}
                  {v.suggestLetter && (
                    <Link
                      href={`/dispute?plan=${encodeURIComponent(v.plan.id)}`}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <FileText className="size-4" aria-hidden />
                      Write the dispute letter
                    </Link>
                  )}
                  {v.stage !== "returned" && (
                    <button
                      type="button"
                      onClick={() => onStage(v.plan.id, ORDER[at - 1])}
                      className="text-sm text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
