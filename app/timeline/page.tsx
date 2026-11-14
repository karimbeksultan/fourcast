"use client";

import { CalendarPlus, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { lowestLine, STATUS_TITLE } from "@/components/copy";
import { cellsFromTimeline, DayStory, ForecastGrid, ForecastLegend } from "@/components/forecast-grid";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-today";
import { formatShort, formatUSD } from "@/lib/dates";
import { buildIcs } from "@/lib/ics";
import { buildTimeline } from "@/lib/plan";
import type { AppState, ISODate } from "@/lib/types";
import { cn } from "@/lib/utils";

function downloadIcs(state: AppState, today: ISODate) {
  const blob = new Blob([buildIcs(state, today, window.location.origin)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fourcast-payments.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function TimelinePage() {
  const [state] = useAppState();
  const today = useToday();
  const [selected, setSelected] = useState<ISODate | null>(null);

  if (state === undefined || !today) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading your forecast">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="aspect-[7/6] w-full max-w-xl" />
      </div>
    );
  }

  if (!state || !state.money) {
    return (
      <section className="max-w-xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Your 6-week forecast</h1>
        <p className="text-lg text-muted-foreground">Add your money and at least one plan, and the forecast shows up here.</p>
        <Link href="/" className={cn(buttonVariants(), "h-12 px-6 text-base")}>
          Add my plans
        </Link>
      </section>
    );
  }

  const t = buildTimeline(state, today);
  const day = t.days.find((d) => d.date === (selected ?? t.lowest.date)) ?? t.days[0];
  const upcoming = t.days.filter((d) => d.events.length > 0).slice(0, 8);

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{STATUS_TITLE[t.status]}</h1>
        <p className="tabular max-w-2xl text-lg sm:text-xl">{lowestLine(t)}</p>
        <p className="tabular text-sm text-muted-foreground">
          {formatUSD(t.owed)} left to pay, {t.debitsInWindow} payments in the next 6 weeks.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-3">
          <ForecastGrid
            cells={cellsFromTimeline(t)}
            today={today}
            ring={t.lowest.date}
            selected={day.date}
            onSelect={setSelected}
          />
          <ForecastLegend />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <DayStory day={day} today={today} />
            {day.date === t.lowest.date && (
              <p className="mt-3 text-sm text-muted-foreground">This is your lowest point in the next 6 weeks.</p>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <h2 className="mb-2 font-semibold">Coming up</h2>
            <ul className="space-y-1.5 text-sm">
              {upcoming.map((d) => (
                <li key={d.date} className="flex justify-between gap-3">
                  <button
                    type="button"
                    className="text-left text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => setSelected(d.date)}
                  >
                    {formatShort(d.date)}
                  </button>
                  <span className="tabular text-right">
                    {d.events
                      .map((e) =>
                        e.kind === "paycheck" ? `Payday +${formatUSD(e.amount)}` : e.kind === "debit" ? `${e.lender} ${formatUSD(e.amount)}` : `Rent ${formatUSD(e.amount)}`,
                      )
                      .join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            {state.plus ? (
              <Button className="h-11 w-full px-5 text-base" onClick={() => downloadIcs(state, today)}>
                <CalendarPlus aria-hidden />
                Add due dates to my calendar
              </Button>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <Lock className="size-4" aria-hidden />
                  Reminders the night before each payment come with Plus.
                </p>
                <Link href="/check" className="font-medium text-primary underline-offset-4 hover:underline">
                  See what Plus does
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
