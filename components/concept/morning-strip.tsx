"use client";

// 21 mornings in a row. Lenders debit in the morning and the paycheck lands later, so the morning is what matters.
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { LENDER_MARK } from "@/components/copy";
import { formatShort, formatUSD, parts } from "@/lib/dates";
import { GUARD_BUFFER } from "@/lib/plan";
import type { Timeline, TimelineDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAYS = 21;
const UP = 112; // px for money above $0
const DOWN = 36; // px for money below $0

function tone(cents: number): string {
  if (cents < 0) return "bg-short";
  if (cents < GUARD_BUFFER) return "bg-tight";
  return "bg-ok";
}

function weekday(date: string): string {
  return formatShort(date).slice(0, 2);
}

export function MorningStrip({ timeline, focus }: { timeline: Timeline; focus?: string }) {
  const days = timeline.days.slice(0, DAYS);
  // Open on the day Tonight is about, or else on the lowest morning.
  const [picked, setPicked] = useState(() => {
    const at = focus ? days.findIndex((d) => d.date === focus) : -1;
    return at >= 0 ? at : days.reduce((a, d, i) => (d.morning < days[a].morning ? i : a), 0);
  });
  const reduce = useReducedMotion() ?? false;
  const strip = useRef<HTMLDivElement>(null);
  // On a phone the strip scrolls sideways: bring the opening day into view once.
  useEffect(() => {
    const box = strip.current;
    const btn = box?.querySelectorAll("button")[picked];
    if (box && btn) box.scrollLeft = Math.max(0, btn.offsetLeft - box.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const top = Math.max(1, ...days.map((d) => Math.max(0, d.morning)));
  const bottom = Math.max(1, ...days.map((d) => Math.max(0, -d.morning)));
  const day = days[picked];

  return (
    <section aria-labelledby="mornings-title" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mornings-title" className="text-xl font-semibold">
          Your next 3 weeks of mornings
        </h2>
        <p className="text-sm text-muted-foreground">Checking before the paycheck lands. Tap a day.</p>
      </div>

      <div ref={strip} className="relative overflow-x-auto rounded-lg border bg-card p-3 sm:p-4">
        <ol className="grid min-w-[620px] gap-1" style={{ gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` }}>
          {days.map((d, i) => {
            const pay = d.events.some((e) => e.kind === "paycheck");
            const debits = d.events.filter((e) => e.kind === "debit");
            const h = d.morning >= 0 ? Math.max(4, (d.morning / top) * UP) : Math.max(4, (-d.morning / bottom) * DOWN);
            return (
              <li key={d.date}>
                <button
                  type="button"
                  onClick={() => setPicked(i)}
                  aria-pressed={picked === i}
                  aria-label={`${i === 0 ? "Today, " : ""}${formatShort(d.date)}: ${formatUSD(d.morning)} in the morning${pay ? ", payday" : ""}${debits.length ? `, ${debits.length} payment${debits.length > 1 ? "s" : ""}` : ""}`}
                  className={cn(
                    "flex w-full flex-col items-center rounded-md px-0.5 pt-1 pb-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    picked === i ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <span className="flex flex-col justify-end" style={{ height: UP }}>
                    {d.morning >= 0 && (
                      <motion.span
                        className={cn("block w-4 rounded-t-sm sm:w-5", tone(d.morning))}
                        style={{ height: h, originY: 1 }}
                        initial={reduce ? false : { scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.55, delay: i * 0.025, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                  </span>
                  <span className="h-px w-full bg-foreground/30" aria-hidden />
                  <span className="flex flex-col justify-start" style={{ height: DOWN }}>
                    {d.morning < 0 && (
                      <motion.span
                        className="block w-4 rounded-b-sm bg-short sm:w-5"
                        style={{ height: h, originY: 0 }}
                        initial={reduce ? false : { scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.55, delay: 0.25 + i * 0.025, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">{weekday(d.date)}</span>
                  <span className={cn("tabular rounded-full px-1.5 text-sm font-semibold", i === 0 && "bg-foreground text-background")}>
                    {parts(d.date).day}
                  </span>
                  <span className="mt-1 flex h-5 flex-wrap justify-center gap-0.5">
                    {pay && <span className="rounded-sm bg-payday px-1 text-[10px] font-semibold leading-5 text-on-payday">Pay</span>}
                    {debits.map((e) =>
                      e.kind === "debit" ? (
                        <span key={e.planId} className="rounded-sm border px-1 text-[10px] font-semibold leading-[18px]">
                          {LENDER_MARK[e.lender]}
                        </span>
                      ) : null,
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <Legend days={days} />
      {day && <DayStory day={day} />}
    </section>
  );
}

function DayStory({ day }: { day: TimelineDay }) {
  return (
    <div className="rounded-lg border bg-card p-4" aria-live="polite">
      <p className="font-semibold">{formatShort(day.date)}</p>
      <ul className="mt-2 space-y-1 text-sm">
        <li className="flex justify-between gap-4">
          <span>Morning, after autopay</span>
          <span className={cn("tabular font-semibold", day.morning < 0 && "text-short")}>{formatUSD(day.morning)}</span>
        </li>
        {day.events.map((e, i) => (
          <li key={i} className="flex justify-between gap-4 text-muted-foreground">
            <span>
              {e.kind === "paycheck" && "Paycheck lands"}
              {e.kind === "rent" && "Rent"}
              {e.kind === "purchase" && "New purchase"}
              {e.kind === "debit" && `${e.lender}, ${e.merchant}`}
            </span>
            <span className={cn("tabular", e.kind === "paycheck" && "text-payday")}>
              {e.kind === "paycheck" ? "+" : "−"}
              {formatUSD(e.amount)}
            </span>
          </li>
        ))}
        {day.spend > 0 && (
          <li className="flex justify-between gap-4 text-muted-foreground">
            <span>Everyday spending</span>
            <span className="tabular">−{formatUSD(day.spend)}</span>
          </li>
        )}
        <li className="flex justify-between gap-4 border-t pt-1">
          <span>End of day</span>
          <span className={cn("tabular font-semibold", day.balance < 0 && "text-short")}>{formatUSD(day.balance)}</span>
        </li>
      </ul>
    </div>
  );
}

const LENDER_NAME: Record<string, string> = { K: "Klarna", A: "Afterpay", Af: "Affirm", Z: "Zip", P: "PayPal" };

/** Says what the chips mean, listing only the lenders on the strip. */
function Legend({ days }: { days: TimelineDay[] }) {
  const marks = [...new Set(days.flatMap((d) => d.events.flatMap((e) => (e.kind === "debit" ? [LENDER_MARK[e.lender]] : []))))];
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="rounded-sm bg-payday px-1 text-[10px] leading-4 font-semibold text-on-payday">Pay</span> paycheck
      </span>
      {marks.map((m) => (
        <span key={m} className="flex items-center gap-1.5">
          <span className="rounded-sm border px-1 text-[10px] leading-4 font-semibold text-foreground">{m}</span> {LENDER_NAME[m] ?? "Other"}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-short" aria-hidden /> below $0
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-tight" aria-hidden /> under $50
      </span>
    </p>
  );
}
