"use client";

// The answer first: one sentence about the next payment that won't make it, and the one thing to do tonight.
import { ArrowRightLeft, BellRing, Check, Hand, MoonStar, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import { moveAmount } from "@/lib/plan";
import type { DebitRisk, ISODate, Timeline } from "@/lib/types";
import { cn } from "@/lib/utils";

function evening(night: ISODate, today: ISODate): string {
  if (night <= today) return "tonight";
  if (night === addDays(today, 1)) return "tomorrow night";
  return `on the evening of ${formatShort(night)}`;
}

export function TonightHero({
  risk,
  more = 0,
  timeline,
  today,
  done = false,
  onDone,
  onRemind,
  plus = false,
}: {
  /** Calendar reminder the evening before (Plus); without Plus the page sends the person to the offer. */
  onRemind?: () => void;
  plus?: boolean;
  risk: DebitRisk | null;
  /** The person said they handled this payment (saved by the page). Without onDone the hero keeps it locally. */
  done?: boolean;
  onDone?: (done: boolean) => void;
  /** Other payments at risk after this one (marked on the 6-week forecast). */
  more?: number;
  timeline: Timeline;
  today: ISODate;
}) {
  const [localDone, setLocalDone] = useState(false);
  const isDone = onDone ? done : localDone;
  const setDone = onDone ?? setLocalDone;

  if (!risk) {
    const next = timeline.days.flatMap((d) => d.events.map((e) => ({ d, e }))).find(({ e }) => e.kind === "debit");
    return (
      <section aria-labelledby="tonight-title" className="rounded-lg bg-ok-soft p-5 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-medium text-ok">
          <ShieldCheck className="size-4" aria-hidden /> Tonight, {formatShort(today)}
        </p>
        <h1 id="tonight-title" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Nothing to do tonight.
        </h1>
        <p className="mt-3 max-w-2xl text-lg">
          Every payment in the next 6 weeks has the money there before it&apos;s taken.
          {next && next.e.kind === "debit" && (
            <>
              {" "}
              Next up: {next.e.lender} takes <span className="tabular font-semibold">{formatUSD(next.e.amount)}</span> on{" "}
              {formatShort(next.d.date)}.
            </>
          )}
        </p>
      </section>
    );
  }

  const fails = risk.level === "fails";
  const night = addDays(risk.date, -1);
  const move = moveAmount(risk.shortBy);

  return (
    <section
      aria-labelledby="tonight-title"
      className={cn("rounded-lg p-5 transition-colors duration-500 sm:p-8", isDone ? "bg-ok-soft" : fails ? "bg-short-soft" : "bg-tight-soft")}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <MoonStar className={cn("size-4", isDone ? "text-ok" : fails ? "text-short" : "text-tight")} aria-hidden /> Tonight,{" "}
        {formatShort(today)}
      </p>
      <h1 id="tonight-title" className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        {isDone
          ? `Done. ${risk.lender} on ${formatShort(risk.date)} is covered.`
          : fails
            ? `${risk.lender} won't clear on ${formatShort(risk.date)}.`
            : `${risk.lender} clears on ${formatShort(risk.date)}, barely.`}
      </h1>

      {!isDone && (
        <>
          <p className="mt-3 max-w-2xl text-lg">
            {fails ? (
              <>
                Autopay takes <span className="tabular font-semibold">{formatUSD(risk.amount)}</span> that morning and you&apos;d be{" "}
                <span className="tabular font-semibold">{formatUSD(risk.shortBy)}</span> short
                {risk.paydayLater ? ", hours before your paycheck lands." : "."}
              </>
            ) : (
              <>
                After it, you&apos;d have <span className="tabular font-semibold">{formatUSD(risk.morning)}</span> in checking that morning.
              </>
            )}
            {risk.limit !== null && (
              <>
                {" "}
                At stake: your <span className="tabular font-semibold">{formatUSD(risk.limit)}</span> {risk.lender} limit.
              </>
            )}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-6">
            <div className="flex gap-3">
              <ArrowRightLeft className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <p>
                {fails ? (
                  <>
                    Move <span className="tabular font-semibold">{formatUSD(move)}</span> into checking {evening(night, today)}.
                    {/* Why the amount is bigger than the shortfall: the rule of moveAmount() in lib/plan.ts, in words. */}
                    <span className="tabular mt-1 block text-sm text-muted-foreground">
                      {formatUSD(risk.shortBy)} short + $10 so one card swipe doesn&apos;t sink it, rounded up to {formatUSD(move)}.
                    </span>
                  </>
                ) : (
                  <>Hold off on card spending until it clears.</>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Hand className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <p>
                {risk.paydayLater
                  ? `Or turn autopay off for this one and pay it in the ${risk.lender} app after your paycheck lands.`
                  : `Or spend ${formatUSD(risk.shortBy)} less from checking before then.`}
              </p>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isDone ? (
          <button
            type="button"
            onClick={() => setDone(false)}
            className="text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Undo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDone(true)}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Check className="size-4" aria-hidden />
            {fails ? `I moved ${formatUSD(move)}` : "Got it"}
          </button>
        )}
        {!isDone && onRemind && risk.date > today && (
          <button
            type="button"
            onClick={onRemind}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-foreground/25 bg-card px-4 font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <BellRing className="size-4" aria-hidden />
            {plus ? "Add the 8 pm reminder" : `Remind me ${formatShort(night).split(",")[0]} at 8 pm`}
          </button>
        )}
        <a
          href={`/plans?due=${risk.date}`}
          className="text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Update my balance first
        </a>
        {more > 0 && (
          <a
            href="/timeline"
            className="text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {more} more payment{more === 1 ? "" : "s"} at risk after this one
          </a>
        )}
      </div>
    </section>
  );
}
