"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toCents } from "@/components/copy";
import { cellsFromVerdict, ForecastGrid, ForecastLegend } from "@/components/forecast-grid";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-today";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import { buildTimeline, checkPurchase } from "@/lib/plan";
import type { AppState, ISODate, Purchase, Timeline, Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CheckPage() {
  const [state, save] = useAppState();
  const today = useToday();
  const [price, setPrice] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (state === undefined || !today) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-11 w-full max-w-sm" />
      </div>
    );
  }

  if (!state || !state.money) {
    return (
      <section className="max-w-xl space-y-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Check a buy</h1>
        <p className="text-lg text-muted-foreground">Add your money first, so we can tell whether a new plan fits.</p>
        <Link href="/" className={cn(buttonVariants(), "h-12 px-6 text-base")}>
          Add my money
        </Link>
      </section>
    );
  }

  const value = price ?? (state.sample ? "240" : "");
  const check = () => {
    const cents = toCents(value);
    if (!cents || cents <= 0) return setError("Enter the price, like 240.");
    setError(null);
    setPurchase({ price: cents, payments: 4 });
  };

  const timeline = buildTimeline(state, today);
  const verdict = purchase ? checkPurchase(state, purchase, today) : null;

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">Check a buy</h1>
        <p className="text-muted-foreground">Pay in 4: the first payment today, then one every 2 weeks.</p>
      </header>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <div className="w-40 space-y-1.5">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            className="h-12 text-lg"
            inputMode="decimal"
            placeholder="$240"
            value={value}
            onChange={(e) => {
              setPrice(e.target.value);
              setPurchase(null);
            }}
          />
        </div>
        <p className="pb-3 text-sm text-muted-foreground">in 4 payments</p>
        <Button type="submit" className="h-12 px-6 text-base">
          Check it
        </Button>
        {error && (
          <p className="w-full text-sm text-short" role="alert">
            {error}
          </p>
        )}
      </form>

      {verdict && purchase && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className={cn("rounded-md border-l-4 bg-card p-4 sm:p-5", verdict.verdict === "fits" ? "border-ok" : "border-short")} aria-live="polite">
              <p className={cn("text-4xl font-bold tracking-tight", verdict.verdict === "fits" ? "text-ok" : "text-short")}>
                {verdict.verdict === "fits" ? "It fits." : "Not right now."}
              </p>
              <p className="mt-1 text-lg">
                {verdict.verdict === "fits"
                  ? "Buying today keeps you above $0 for the next 6 weeks."
                  : "Buying today would take you below $0."}
              </p>
              <p className="tabular mt-2 text-sm text-muted-foreground">
                {verdict.schedule.length} payments of {formatUSD(verdict.schedule[1]?.amount ?? verdict.schedule[0].amount)}:{" "}
                {verdict.schedule.map((p, i) => (i === 0 ? "today" : formatShort(p.date))).join(", ")}
              </p>
            </section>

            {state.plus ? (
              <PlusAnswer verdict={verdict} timeline={timeline} state={state} today={today} />
            ) : (
              <div className="relative">
                <div className="pointer-events-none blur-[6px] select-none" aria-hidden>
                  <ForecastGrid cells={cellsFromVerdict(verdict, timeline)} today={today} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium">
                    <Lock className="size-4" aria-hidden />
                    The day it fits is part of Plus
                  </p>
                </div>
              </div>
            )}
          </div>

          <Plus state={state} timeline={timeline} today={today} save={save} />
        </div>
      )}
    </>
  );
}

function PlusAnswer({ verdict, timeline, state, today }: { verdict: Verdict; timeline: Timeline; state: AppState; today: ISODate }) {
  const best = verdict.bestDay;
  const bestIndex = verdict.fitsByDay.findIndex((f) => f.date === best);
  const fitsFromBest = bestIndex >= 0 && verdict.fitsByDay.slice(bestIndex).every((f) => f.fits);
  const syncOff = state.money && (state.money.frequency === "monthly" || state.money.frequency === "semimonthly");

  return (
    <section className="space-y-4" aria-labelledby="answer">
      <h2 id="answer" className="sr-only">
        When it fits
      </h2>
      <div className="tabular space-y-1.5 text-lg">
        {verdict.firstShort && verdict.deepest && (
          <p>
            You&apos;d be {formatUSD(verdict.deepest.amount)} short on {formatShort(verdict.deepest.date)}
            {verdict.firstShort.date !== verdict.deepest.date && `, first short on ${formatShort(verdict.firstShort.date)}`}.
          </p>
        )}
        {best ? (
          verdict.verdict === "fits" ? (
            <p>Buy today or on any green day below.</p>
          ) : (
            <p>
              It {fitsFromBest ? "fits if you buy on or after" : "first fits on"} {formatShort(best)}.
            </p>
          )
        ) : (
          <p>It doesn&apos;t fit on any day in the next 6 weeks. Try a smaller price.</p>
        )}
      </div>

      {verdict.paydaySync ? (
        <div className="rounded-md bg-payday p-4 text-primary-foreground sm:p-5">
          <p className="text-2xl font-bold tracking-tight">
            Buy {formatShort(verdict.paydaySync.buyOn)}: all 4 payments land on paydays.
          </p>
          <p className="tabular mt-1 opacity-90">{verdict.paydaySync.debits.map((d) => formatShort(d)).join(", ")}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {syncOff
            ? "Payday Sync works with weekly or every-2-weeks pay."
            : "No payday in the next 6 weeks fits this buy."}
        </p>
      )}

      <ForecastGrid
        cells={cellsFromVerdict(verdict, timeline)}
        today={today}
        ring={verdict.paydaySync?.buyOn ?? best}
        ringTone="payday"
        animate
      />
      <ForecastLegend mode="fit" />
    </section>
  );
}

function Plus({ state, timeline, today, save }: { state: AppState; timeline: Timeline; today: ISODate; save: (s: AppState) => void }) {
  const [step, setStep] = useState<"offer" | "checkout">("offer");
  const [plan, setPlan] = useState<"year" | "month">("year");
  const trialEnds = timeline.paydays[1] ?? addDays(today, 28);

  if (state.plus) {
    return (
      <aside className="h-fit space-y-2 rounded-md border bg-card p-4 text-sm">
        <p className="font-semibold">Plus is on until {formatShort(state.plus.trialEnds)}.</p>
        <p className="text-muted-foreground">
          {state.plus.via === "demo" ? "Demo trial, no real payment." : "Test-mode payment."} Then $29.99 a year.
        </p>
        <Button variant="link" className="h-auto p-0 text-muted-foreground" onClick={() => save({ ...state, plus: null })}>
          Cancel Plus
        </Button>
      </aside>
    );
  }

  return (
    <aside className="h-fit space-y-4 rounded-md border-2 border-payday bg-card p-4 sm:p-5" aria-labelledby="plus">
      <h2 id="plus" className="text-xl font-semibold">
        See the day it fits
      </h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>The exact day you&apos;d run short, and by how much</li>
        <li>The first day it fits</li>
        <li>Payday Sync: the day to buy so every payment lands on a payday</li>
        <li>A reminder the night before each payment</li>
      </ul>

      {step === "offer" ? (
        <>
          <div>
            <p className="tabular text-3xl font-bold">$29.99 a year</p>
            <p className="text-sm text-muted-foreground">or $4.99 a month</p>
          </div>
          <p className="text-sm">
            Free for your next 2 paydays, until {formatShort(trialEnds)}. Cancel any time on this page.
          </p>
          <Button className="h-12 w-full text-base" onClick={() => setStep("checkout")}>
            Start free trial
          </Button>
        </>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save({ ...state, plus: { since: today, trialEnds, via: "demo" } });
          }}
        >
          <p className="rounded-lg bg-tight-soft px-3 py-2 text-sm">Demo checkout — no real payment.</p>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">After the trial</legend>
            {(
              [
                ["year", "$29.99 a year", "Save 50%"],
                ["month", "$4.99 a month", ""],
              ] as const
            ).map(([id, label, note]) => (
              <label key={id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-payday has-checked:bg-payday-soft">
                <input type="radio" name="plan" value={id} checked={plan === id} onChange={() => setPlan(id)} className="accent-payday" />
                <span className="tabular font-medium">{label}</span>
                {note && <span className="ml-auto text-xs text-muted-foreground">{note}</span>}
              </label>
            ))}
          </fieldset>
          <p className="text-sm text-muted-foreground">Nothing is charged before {formatShort(trialEnds)}.</p>
          <Button type="submit" className="h-12 w-full text-base">
            Start my free trial
          </Button>
        </form>
      )}
    </aside>
  );
}
