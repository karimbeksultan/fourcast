"use client";

import { CalendarCheck, CircleCheck, Lock, Sunrise } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { morningRiskLine, toCents, verdictLine } from "@/components/copy";
import { PlusOffer } from "@/components/plus-offer";
import { cellsFromVerdict, ForecastGrid, ForecastLegend } from "@/components/forecast-grid";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useQueryParam } from "@/hooks/use-query-param";
import { useToday } from "@/hooks/use-today";
import { addDays, formatShort, formatUSD } from "@/lib/dates";
import { buildTimeline, checkPurchase, PAY_IN_4_INTERVAL, paydaysBetween } from "@/lib/plan";
import type { AppState, ISODate, Purchase, Timeline, Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Prices to try with one tap: they only fill the field; the answer still comes from checkPurchase. */
const QUICK_PRICES = ["100", "240", "500"];
/** Pay in 4 doesn't go higher than this; in cents. */
const MAX_PRICE = 1_000_000;

export default function CheckPage() {
  const [state, save] = useAppState();
  const today = useToday();
  const [price, setPrice] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeNote, setStripeNote] = useState<string | null>(null);
  const sessionId = useQueryParam("session_id");
  const handled = useRef(false);

  // Back from Stripe test checkout: /check?session_id=cs_test_… → ask the server, then turn Plus on.
  useEffect(() => {
    if (!sessionId || !state || !today || handled.current) return;
    handled.current = true;
    window.history.replaceState(null, "", "/check");
    fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json() as Promise<{ ok?: boolean }>)
      .then((d) => {
        if (d.ok) {
          const trialEnds = buildTimeline(state, today).paydays[1] ?? addDays(today, 28);
          // Keep the checkout session id: it is the only key to the test subscription, and "Cancel Plus" needs it.
          const kept = /^cs_test_[A-Za-z0-9]+$/.test(sessionId) ? { sessionId } : {};
          save({ ...state, plus: { since: today, trialEnds, via: "stripe_test", ...kept } });
          setStripeNote("Plus is on. Your test payment went through.");
        } else {
          setStripeNote("The test checkout didn't finish. Start the trial again when you're ready.");
        }
      })
      .catch(() => setStripeNote("Couldn't confirm the test checkout. Start the trial again when you're ready."));
  }, [sessionId, state, today, save]);

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
        <Link href="/plans" className={cn(buttonVariants(), "h-12 px-6 text-base")}>
          Add my money
        </Link>
      </section>
    );
  }

  const value = price ?? (state.sample ? "240" : "");
  const check = () => {
    const cents = toCents(value);
    if (!cents || cents <= 0) return setError("Enter the price, like 240.");
    if (cents > MAX_PRICE) return setError("Enter a price up to $10,000.");
    setError(null);
    setPurchase({ price: cents, payments: 4 });
  };

  const timeline = buildTimeline(state, today);
  const verdict = purchase ? checkPurchase(state, purchase, today) : null;

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Check a buy</h1>
        <p className="text-muted-foreground">Pay in 4: the first payment today, then one every 2 weeks.</p>
        {stripeNote && (
          <p className="rounded-md bg-ok-soft px-3 py-2 font-medium" role="status">
            {stripeNote}
          </p>
        )}
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
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "price-error" : undefined}
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
          <p id="price-error" className="w-full text-sm text-short" role="alert">
            {error}
          </p>
        )}
        <div className="flex w-full flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Or try</span>
          {QUICK_PRICES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={value === p}
              onClick={() => {
                setPrice(p);
                setError(null);
                setPurchase(null);
              }}
              className={cn(
                "tabular h-11 rounded-full border px-4 font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                value === p && "border-primary bg-ok-soft",
              )}
            >
              ${p}
            </button>
          ))}
        </div>
      </form>

      {!purchase && (
        <section aria-labelledby="what-you-get" className="max-w-xl rounded-md border bg-card p-4 sm:p-5">
          <h2 id="what-you-get" className="font-semibold">
            What the answer tells you
          </h2>
          <ul className="mt-3 space-y-2.5 text-muted-foreground">
            <li className="flex gap-2.5">
              <CircleCheck className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
              Whether it fits today, with your other plans and rent counted in.
            </li>
            <li className="flex gap-2.5">
              <Sunrise className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
              If it doesn&apos;t: the first morning you&apos;d be short, and by how much.
            </li>
            <li className="flex gap-2.5">
              <CalendarCheck className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden />
              The 4 payment dates. With Plus, the day to buy so each one lands after payday.
            </li>
          </ul>
        </section>
      )}

      {verdict && purchase && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <VerdictCard verdict={verdict} plus={Boolean(state.plus)} />
          <div className="xl:col-start-2 xl:row-span-2 xl:row-start-1">
            <Plus state={state} timeline={timeline} verdict={verdict} today={today} save={save} />
          </div>
          <div className="xl:col-start-1">
            {state.plus ? (
              <PlusAnswer verdict={verdict} timeline={timeline} state={state} today={today} />
            ) : (
              <div className="relative">
                {/* Teaser only: every day looks the same, so the answer stays behind the paywall. */}
                <div className="pointer-events-none blur-[5px] select-none" aria-hidden>
                  <ForecastGrid
                    cells={cellsFromVerdict(verdict, timeline).map((c) => ({ ...c, tone: "nofit" as const, marks: [], rent: false }))}
                    today={today}
                  />
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
        </div>
      )}
    </>
  );
}

function VerdictCard({ verdict, plus }: { verdict: Verdict; plus: boolean }) {
  const fits = verdict.verdict === "fits";
  const sync = verdict.paydaySync;
  const answer = plus && !fits ? (sync?.buyOn ?? verdict.bestDay) : null;
  const title = fits ? "It fits." : answer ? `Not today. Buy ${formatShort(answer)}.` : "Not right now.";
  const morning = morningRiskLine(verdict);
  const line = fits
    ? verdictLine(verdict)
    : answer && sync
      ? "Then every payment lands the morning after payday."
      : verdictLine(verdict);
  return (
    <section
      className={cn("rounded-md p-4 sm:p-6 xl:col-start-1", fits ? "bg-ok-soft" : answer ? "bg-payday-soft" : "bg-short-soft")}
      aria-live="polite"
    >
      <p className={cn("text-4xl font-bold tracking-tight sm:text-5xl", fits ? "text-ok" : answer ? "text-accent-foreground" : "text-short")}>
        {title}
      </p>
      <p className="mt-2 text-lg">{line}</p>
      {morning && <p className="tabular mt-1 font-medium">{morning}</p>}
      <p className="tabular mt-2 text-sm text-muted-foreground">
        {verdict.schedule.length} payments of {formatUSD(verdict.schedule[1]?.amount ?? verdict.schedule[0].amount)} if bought today:{" "}
        {verdict.schedule.map((p, i) => (i === 0 ? "today" : formatShort(p.date))).join(", ")}
      </p>
    </section>
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
      {verdict.paydaySync ? (
        <div className="rounded-md bg-payday p-5 text-on-payday sm:p-6">
          <p className="text-2xl font-bold tracking-tight sm:text-3xl">
            Buy {formatShort(verdict.paydaySync.buyOn)}: every payment lands the morning after payday.
          </p>
          <p className="tabular mt-1 opacity-90">{verdict.paydaySync.debits.map((d) => formatShort(d)).join(", ")}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {syncOff ? "Payday Sync works with weekly or every-2-weeks pay." : "No payday in the next 6 weeks fits this buy."}
        </p>
      )}
      <div className="tabular space-y-1.5 text-lg">
        {verdict.firstShort && verdict.deepest && (
          <p>
            Bought today, you&apos;d be {formatUSD(verdict.deepest.amount)} short on {formatShort(verdict.deepest.date)}
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

function Plus({
  state,
  timeline,
  verdict,
  today,
  save,
}: {
  state: AppState;
  timeline: Timeline;
  verdict: Verdict;
  today: ISODate;
  save: (s: AppState) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(false);
  // With a checkout session id, cancel the test subscription in Stripe first, then turn Plus off here.
  // Plus stays on only when Stripe could not be reached, so the screen never says "cancelled" while a subscription lives.
  const cancel = async () => {
    const id = state.plus?.sessionId;
    setCancelError(false);
    if (id) {
      setCancelling(true);
      try {
        const res = await fetch("/api/checkout/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id }),
        });
        // 404: no subscription behind this session; 503: no Stripe keys on the server. Nothing left to cancel.
        if (!res.ok && res.status !== 404 && res.status !== 503) {
          setCancelError(true);
          return;
        }
      } catch {
        setCancelError(true);
        return;
      } finally {
        setCancelling(false);
      }
    }
    save({ ...state, plus: null });
  };

  if (state.plus) {
    // The 4 payments if bought on the recommended day: Payday Sync first, then the first day it fits.
    const buyOn = verdict.paydaySync?.buyOn ?? verdict.bestDay ?? today;
    const payments = verdict.schedule.map((p, k) => ({ date: addDays(buyOn, k * PAY_IN_4_INTERVAL), amount: p.amount }));
    // Payday Sync puts payments the morning after a paycheck, when the money is already there.
    const paydays = new Set(paydaysBetween(state.money, addDays(buyOn, -1), payments[payments.length - 1].date));
    return (
      <aside className="h-fit space-y-4 rounded-md border bg-card p-4 sm:p-5" aria-labelledby="payments">
        <div>
          <h2 id="payments" className="text-xl font-semibold">
            Your 4 payments
          </h2>
          <p className="text-sm text-muted-foreground">If you buy {buyOn === today ? "today" : formatShort(buyOn)}</p>
        </div>
        <ol className="space-y-2">
          {payments.map((p, i) => (
            <li key={p.date} className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2.5">
              <span>
                <span className="text-muted-foreground">{i + 1}.</span> {formatShort(p.date)}
              </span>
              <span className="flex items-center gap-2">
                {paydays.has(addDays(p.date, -1)) && (
                  <span className="rounded bg-payday-soft px-1.5 py-0.5 text-xs font-medium text-accent-foreground">After payday</span>
                )}
                <span className="tabular font-semibold">{formatUSD(p.amount)}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="space-y-1 border-t pt-3 text-sm">
          <p className="font-semibold">Plus is on until {formatShort(state.plus.trialEnds)}.</p>
          <p className="text-muted-foreground">
            {state.plus.via === "demo" ? "Demo trial, no real payment." : "Stripe test mode, no real money moves."} After the trial, the
            plan you picked starts.
          </p>
          <Button variant="link" className="h-11 p-0 text-muted-foreground" disabled={cancelling} onClick={() => void cancel()}>
            {cancelling ? "Cancelling…" : "Cancel Plus"}
          </Button>
          {cancelError && (
            <p className="text-short" role="alert">
              Couldn&apos;t reach Stripe to cancel. Plus is still on; try again in a moment.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {state.plus.sessionId
              ? "Turns Plus off and cancels the test subscription in Stripe."
              : "Turns Plus off in this browser. Test mode: no real subscription is billed."}
          </p>
        </div>
      </aside>
    );
  }

  return <PlusOffer state={state} timeline={timeline} today={today} save={save} />;
}
