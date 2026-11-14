"use client";

import Link from "next/link";
import { useState } from "react";
import { AddPlan } from "@/components/add-plan";
import { Landing } from "@/components/landing";
import { LowestLine } from "@/components/money";
import { CheckIn } from "@/components/check-in";
import { FREQUENCY_LABEL, STATUS_TITLE } from "@/components/copy";
import { MoneyForm } from "@/components/money-form";
import { PlanCard } from "@/components/plan-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useQueryParam } from "@/hooks/use-query-param";
import { useToday } from "@/hooks/use-today";
import { formatShort, formatUSD } from "@/lib/dates";
import { buildTimeline } from "@/lib/plan";
import { getSampleState } from "@/lib/sample";
import { clearState, emptyState } from "@/lib/storage";
import type { AppState, ISODate } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Home() {
  const [state, save] = useAppState();
  const today = useToday();

  if (state === undefined || !today) return <HomeSkeleton />;
  if (state === null) return <Welcome onSample={() => save(getSampleState(today))} onStart={() => save(emptyState())} />;
  return <Overview state={state} today={today} save={save} />;
}

function HomeSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading your plans">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function Welcome({ onSample, onStart }: { onSample: () => void; onStart: () => void }) {
  return <Landing onSample={onSample} onStart={onStart} />;
}

function Overview({ state, today, save }: { state: AppState; today: ISODate; save: (s: AppState) => void }) {
  const due = useQueryParam("due");
  const [checkInOpen, setCheckInOpen] = useState(true);
  const [editMoney, setEditMoney] = useState(false);
  const timeline = state.money ? buildTimeline(state, today) : null;
  const showCheckIn = checkInOpen && due && /^\d{4}-\d{2}-\d{2}$/.test(due) && state.money;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your plans</h1>
          {state.sample && <Badge variant="secondary">Sample data</Badge>}
        </div>
        <Button variant="ghost" className="h-10 text-muted-foreground" onClick={() => clearState()}>
          {state.sample ? "Clear sample data" : "Start over"}
        </Button>
      </div>

      {showCheckIn && (
        <CheckIn
          due={due}
          state={state}
          today={today}
          onSave={save}
          onClose={() => {
            setCheckInOpen(false);
            window.history.replaceState(null, "", "/");
          }}
        />
      )}

      {timeline && (
        <Link
          href="/timeline"
          className={cn(
            "block rounded-md border-l-4 bg-card p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5",
            timeline.status === "ok" ? "border-ok" : timeline.status === "tight" ? "border-tight" : "border-short",
          )}
        >
          <p className="text-4xl font-bold tracking-tight sm:text-5xl">{STATUS_TITLE[timeline.status]}</p>
          <LowestLine timeline={timeline} className="mt-1 text-lg" />
          <p className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline">See your 6-week forecast</p>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {state.plans.length > 0 ? (
            <section aria-labelledby="plans" className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="plans" className="text-lg font-semibold">
                  {state.plans.length} {state.plans.length === 1 ? "plan" : "plans"}
                </h2>
                {timeline && <p className="tabular text-sm text-muted-foreground">{formatUSD(timeline.owed)} left to pay</p>}
              </div>
              <ul className="space-y-2">
                {state.plans.map((p) => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    state={state}
                    today={today}
                    onRemove={() => save({ ...state, plans: state.plans.filter((x) => x.id !== p.id) })}
                  />
                ))}
              </ul>
            </section>
          ) : (
            <p className="rounded-md border border-dashed p-4 text-muted-foreground">
              No plans yet. Add your first Klarna, Afterpay or Affirm plan below.
            </p>
          )}
          <AddPlan today={today} sample={state.sample} onAdd={(plan) => save({ ...state, plans: [...state.plans, plan] })} />
        </div>

        <section aria-labelledby="money" className="h-fit space-y-3 rounded-md border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="money" className="text-lg font-semibold">
              Your money
            </h2>
            {state.money && !editMoney && (
              <Button variant="outline" className="h-9" onClick={() => setEditMoney(true)}>
                Edit
              </Button>
            )}
          </div>
          {state.money && !editMoney ? (
            <dl className="tabular grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">In checking</dt>
              <dd>{formatUSD(state.money.balance)}</dd>
              <dt className="text-muted-foreground">Paycheck</dt>
              <dd>
                {formatUSD(state.money.paycheck)}, {FREQUENCY_LABEL[state.money.frequency].toLowerCase()}
              </dd>
              <dt className="text-muted-foreground">Next payday</dt>
              <dd>{formatShort(state.money.nextPayday)}</dd>
              <dt className="text-muted-foreground">Rent</dt>
              <dd>{state.money.rent > 0 ? `${formatUSD(state.money.rent)} on day ${state.money.rentDay}` : "None"}</dd>
              <dt className="text-muted-foreground">Everyday</dt>
              <dd>{formatUSD(state.money.weeklySpend)} a week</dd>
            </dl>
          ) : (
            <>
              {!state.money && <p className="text-sm text-muted-foreground">Add your money to see the forecast.</p>}
              <MoneyForm
                initial={state.money}
                today={today}
                onSave={(money) => {
                  save({ ...state, money });
                  setEditMoney(false);
                }}
              />
            </>
          )}
        </section>
      </div>

      {timeline && state.plans.length > 0 && (
        <Link href="/check" className={cn(buttonVariants({ variant: "outline" }), "h-12 self-start px-6 text-base")}>
          Check a new buy
        </Link>
      )}
    </>
  );
}
