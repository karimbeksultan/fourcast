// "What Fourcast caught": the short list that answers "why keep this?". It is read from what the app
// already knows (payments at risk in the forecast, "I moved it" answers, returns being followed),
// so it invents nothing. Amounts come from lib/plan.ts.
import { Check, PackageCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { ackKey, type ReturnView } from "@/lib/concept";
import { formatShort, formatUSD } from "@/lib/dates";
import { moveAmount } from "@/lib/plan";
import type { DebitRisk } from "@/lib/types";
import { cn } from "@/lib/utils";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function CaughtLog({
  risks,
  acks,
  views,
}: {
  /** Payments at risk that are not on a returned plan, in Guard order. */
  risks: DebitRisk[];
  /** "I moved it" answers from the hero, by ackKey(planId, date). */
  acks: Record<string, true>;
  views: ReturnView[];
}) {
  const handled = risks.filter((r) => acks[ackKey(r.planId, r.date)]).length;
  const empty = risks.length === 0 && views.length === 0;

  return (
    <section aria-labelledby="caught-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="caught-title" className="text-xl font-semibold">
          What Fourcast caught
        </h2>
        {!empty && (
          <p className="text-sm text-muted-foreground">
            {[
              risks.length > 0 && `${plural(risks.length, "payment")} flagged`,
              handled > 0 && `${handled} handled`,
              views.length > 0 && `${plural(views.length, "return")} followed`,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      {empty ? (
        <p className="rounded-lg border bg-card p-4 text-muted-foreground">
          Nothing yet. A payment that won&apos;t clear before your paycheck, or a refund that stalls, will be listed here.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {risks.map((r) => {
            const done = Boolean(acks[ackKey(r.planId, r.date)]);
            const fails = r.level === "fails";
            return (
              <li key={`${r.planId}@${r.date}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-3 sm:px-4">
                <p className="flex min-w-0 items-start gap-2.5">
                  {done ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
                  ) : (
                    <TriangleAlert className={cn("mt-0.5 size-4 shrink-0", fails ? "text-short" : "text-tight")} aria-hidden />
                  )}
                  <span className="tabular">
                    <span className="font-semibold">
                      {r.lender}, {formatShort(r.date)}.
                    </span>{" "}
                    {fails
                      ? `${formatUSD(r.amount)} wouldn't clear: ${formatUSD(r.shortBy)} short${r.paydayLater ? " before your paycheck" : ""}.`
                      : `${formatUSD(r.amount)} clears with only ${formatUSD(r.morning)} left.`}
                  </span>
                </p>
                <p
                  className={cn(
                    "tabular shrink-0 pl-6.5 text-sm font-semibold sm:pl-0",
                    done ? "text-ok" : fails ? "text-short" : "text-tight",
                  )}
                >
                  {done ? (fails ? `You moved ${formatUSD(moveAmount(r.shortBy))}` : "You held off") : "Open"}
                </p>
              </li>
            );
          })}
          {views.map((v) => (
            <li key={v.plan.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-3 sm:px-4">
              <p className="flex min-w-0 items-start gap-2.5">
                <PackageCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="tabular">
                  <span className="font-semibold">{v.plan.merchant} return.</span>{" "}
                  {v.stillScheduled.length > 0
                    ? `${v.plan.lender} still has ${plural(v.stillScheduled.length, "payment")} of ${formatUSD(v.plan.installment)} scheduled.`
                    : `Waiting for ${v.plan.lender} to credit it.`}
                </span>
              </p>
              {v.suggestLetter ? (
                <Link
                  href={`/dispute?plan=${v.plan.id}`}
                  className="shrink-0 pl-6.5 text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 sm:pl-0"
                >
                  Letter ready
                </Link>
              ) : (
                <p className="shrink-0 pl-6.5 text-sm font-semibold text-muted-foreground sm:pl-0">
                  {v.stage === "store_refunded" ? "Store refunded" : "Sent back"}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">
        From your plans for the next 6 weeks. Fourcast doesn&apos;t see your bank, so &quot;moved&quot; is what you told it.
      </p>
    </section>
  );
}
