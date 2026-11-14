"use client";

// Guard (LIMIT_GUARD.md F1): the payments that won't make it, and what to do the night before.
import { ArrowRightLeft, BellRing, CalendarCheck, Hand, ShieldCheck, TriangleAlert } from "lucide-react";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import type { ISODate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { moveAmount } from "@/lib/plan";
import type { DebitRisk } from "@/lib/types";
import { LENDER_MARK } from "./copy";

export function guardTitle(risks: DebitRisk[]): string {
  if (risks.length === 0) return "Your limits are safe.";
  if (risks.every((r) => r.level === "tight")) return risks.length === 1 ? "1 payment is tight." : `${risks.length} payments are tight.`;
  return risks.length === 1 ? "1 payment at risk." : `${risks.length} payments at risk.`;
}

export function GuardSummary({ risks }: { risks: DebitRisk[] }) {
  const fails = risks.some((r) => r.level === "fails");
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md p-4 sm:p-6",
        risks.length === 0 ? "bg-ok-soft" : fails ? "bg-short-soft" : "bg-tight-soft",
      )}
    >
      {risks.length === 0 ? (
        <ShieldCheck className="mt-1 size-8 shrink-0 text-ok" aria-hidden />
      ) : (
        <TriangleAlert className={cn("mt-1 size-8 shrink-0", fails ? "text-short" : "text-tight")} aria-hidden />
      )}
      <div>
        <p className="text-4xl font-bold tracking-tight sm:text-5xl">{guardTitle(risks)}</p>
        <p className="mt-2 text-lg">
          {risks.length === 0
            ? "Every payment in the next 6 weeks has the money there before it's taken."
            : fails
              ? "Autopay runs in the morning. Fix these the night before so a late payment doesn't cost you your limit."
              : risks.length === 1
                ? "It clears, but leaves almost nothing that morning."
                : "They clear, but leave almost nothing that morning."}
        </p>
      </div>
    </div>
  );
}

function reason(r: DebitRisk): string {
  if (r.level === "tight") return `It clears, but leaves you ${formatUSD(r.morning)} that morning.`;
  const short = `You'd be ${formatUSD(r.shortBy)} short`;
  return r.paydayLater ? `${short} before your paycheck lands. Autopay usually runs first.` : `${short} that morning.`;
}

export function RiskCard({
  risk,
  today,
  plus = false,
  onRemind,
}: {
  risk: DebitRisk;
  today: ISODate;
  plus?: boolean;
  onRemind?: () => void;
}) {
  const fails = risk.level === "fails";
  const night = addDays(risk.date, -1);
  return (
    <li className={cn("rounded-md border-2 bg-card p-4", fails ? "border-short" : "border-tight")}>
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold"
          aria-hidden
        >
          {LENDER_MARK[risk.lender]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 font-semibold">
            <span>
              {risk.lender}
              {risk.merchant && <span className="font-normal text-muted-foreground">, {risk.merchant}</span>}
            </span>
            <span className="tabular text-lg">{formatUSD(risk.amount)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {risk.date === today ? "Today" : formatShort(risk.date)}, morning
          </p>
        </div>
      </div>

      <p className={cn("mt-3 font-medium", fails ? "text-short" : "text-tight")}>{reason(risk)}</p>
      {risk.limit !== null && risk.limit !== undefined && (
        <p className="mt-1 text-sm">
          What&apos;s at stake: your <span className="tabular font-semibold">{formatUSD(risk.limit)}</span> {risk.lender} limit.
        </p>
      )}

      <ul className="mt-3 space-y-2 text-sm">
        {fails && (
          <li className="flex gap-2">
            <ArrowRightLeft className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Move <span className="tabular font-semibold">{formatUSD(moveAmount(risk.shortBy))}</span> into checking{" "}
              {night === today ? "tonight" : night < today ? "now" : `on the evening of ${formatShort(night)}`}.
            </span>
          </li>
        )}
        {fails && risk.paydayLater && (
          <li className="flex gap-2">
            <Hand className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Or pay it by hand in the {risk.lender} app after your paycheck lands.</span>
          </li>
        )}
        {!fails && (
          <li className="flex gap-2">
            <Hand className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Hold off on card spending until it clears.</span>
          </li>
        )}
      </ul>

      {risk.date > today && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {onRemind && (
            <button
              type="button"
              onClick={onRemind}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <BellRing className="size-4" aria-hidden />
              {plus ? "Add the 8 pm reminders to my calendar" : `Remind me at 8 pm on ${formatShort(night)}`}
            </button>
          )}
          <a
          href={`/plans?due=${risk.date}`}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <CalendarCheck className="size-4" aria-hidden />
          Check my balance for {formatShort(risk.date)}
          </a>
        </div>
      )}
    </li>
  );
}
