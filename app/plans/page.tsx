"use client";

import Link from "next/link";
import { useState } from "react";
import { AddPlan } from "@/components/add-plan";
import { GuardSummary, RiskCard } from "@/components/guard";
import { LowestLine } from "@/components/money";
import { CheckIn } from "@/components/check-in";
import { FREQUENCY_LABEL } from "@/components/copy";
import { downloadIcs } from "@/components/ics-download";
import { LimitsForm } from "@/components/limits-form";
import { MoneyForm } from "@/components/money-form";
import { PlusOffer } from "@/components/plus-offer";
import { PlanCard } from "@/components/plan-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useQueryParam } from "@/hooks/use-query-param";
import { useToday } from "@/hooks/use-today";
import { formatShort, formatUSD } from "@/lib/dates";
import { buildTimeline, debitRisks, planDebits } from "@/lib/plan";
import { getSampleState } from "@/lib/sample";
import { clearState, emptyState } from "@/lib/storage";
import type { AppState, ISODate } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PlansPage() {
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
  return (
    <section className="max-w-2xl space-y-5 py-6 sm:py-12">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your plans live here</h1>
      <p className="text-lg text-muted-foreground">
        Try Fourcast on sample data first, or add your own Klarna, Afterpay and Affirm plans. It takes about a minute.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button className="h-12 px-6 text-base" onClick={onSample}>
          Try it with sample data
        </Button>
        <Button variant="outline" className="h-12 px-6 text-base" onClick={onStart}>
          Start with my numbers
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">No sign-up. Your data stays in this browser.</p>
    </section>
  );
}

function Overview({ state, today, save }: { state: AppState; today: ISODate; save: (s: AppState) => void }) {
  const due = useQueryParam("due");
  const [checkInOpen, setCheckInOpen] = useState(true);
  const [editMoney, setEditMoney] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timeline = state.money ? buildTimeline(state, today) : null;
  const returns: Record<string, ISODate> = Object.fromEntries(
    state.plans.filter((p) => p.status === "returned" && p.returnedOn).map((p) => [p.id, p.returnedOn as ISODate]),
  );
  const risks = state.money ? debitRisks(state, today).filter((r) => !r.disputed) : [];
  const remind = () => {
    if (state.plus) downloadIcs(state, today);
    else document.getElementById("plus")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const setReturned = (id: string, on: ISODate | null) =>
    save({
      ...state,
      plans: state.plans.map((x) => {
        if (x.id !== id) return x;
        if (on) return { ...x, status: "returned" as const, returnedOn: on };
        const rest = { ...x };
        delete rest.returnedOn;
        return { ...rest, status: "active" as const };
      }),
    });
  const disputed = state.plans.filter((p) => returns[p.id] && planDebits(p, today).length > 0);
  const showCheckIn = checkInOpen && due && /^\d{4}-\d{2}-\d{2}$/.test(due) && state.money;

  return (
    <>
      <div className="space-y-2">
        <h1 className={timeline ? "sr-only" : "text-4xl font-bold tracking-tight sm:text-5xl"}>
          {timeline ? "Plans" : "Your plans"}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {state.sample && <Badge variant="secondary">Sample data</Badge>}
          <Button variant="outline" size="sm" className="h-8" onClick={() => clearState()}>
            {state.sample ? "Clear sample data" : "Start over"}
          </Button>
        </div>
      </div>

      {notice && (
        <p className="rounded-md bg-foreground px-4 py-3 font-semibold text-background" role="status">
          {notice}
        </p>
      )}

      {showCheckIn && (
        <CheckIn
          due={due}
          state={state}
          today={today}
          onSave={save}
          onClose={() => {
            setCheckInOpen(false);
            window.history.replaceState(null, "", "/plans");
          }}
        />
      )}

      {timeline && (
        <section aria-label="Payments at risk" className="space-y-3">
          <GuardSummary risks={risks} />
          {disputed.length > 0 && (
            <ul className="grid gap-3 md:grid-cols-2" aria-label="Returned, may still be taken">
              {disputed.map((p) => {
                const next = planDebits(p, today)[0];
                return (
                  <li key={p.id} className="rounded-md border-2 border-tight bg-card p-4">
                    <p className="font-semibold">
                      {p.lender}
                      {p.merchant && <span className="font-normal text-muted-foreground">, {p.merchant}</span>}
                      <span className="font-normal text-muted-foreground"> — returned {formatShort(returns[p.id])}</span>
                    </p>
                    <p className="mt-1 font-medium text-tight">
                      Next <span className="tabular">{formatUSD(p.installment)}</span> on {formatShort(next)} may still be taken. Dispute it
                      before then.
                    </p>
                    <a
                      href={`/dispute?plan=${encodeURIComponent(p.id)}`}
                      className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      Write my dispute
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          {risks.length > 0 && (
            <ul className="grid gap-3 md:grid-cols-2">
              {risks.map((r) => (
                <RiskCard key={`${r.planId}-${r.date}`} risk={r} today={today} plus={Boolean(state.plus)} onRemind={remind} />
              ))}
            </ul>
          )}
          {!state.plus && <PlusOffer state={state} timeline={timeline} today={today} save={save} />}
          <Link
            href="/timeline"
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <LowestLine timeline={timeline} className="text-sm sm:text-base" />
            <span className="text-sm font-semibold text-primary">See your 6-week forecast</span>
          </Link>
        </section>
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
                    returnedOn={returns[p.id] ?? null}
                    onReturned={(on) => setReturned(p.id, on)}
                    onUndoReturn={() => setReturned(p.id, null)}
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
          <AddPlan
            today={today}
            sample={state.sample}
            onAdd={(plan) => {
              const next = { ...state, plans: [...state.plans, plan] };
              save(next);
              if (next.money) {
                const n = debitRisks(next, today).filter((r) => !r.disputed).length;
                setNotice(
                  `${plan.lender} plan added. Guard updated: ${n === 0 ? "your limits are safe." : n === 1 ? "1 payment at risk." : `${n} payments at risk.`}`,
                );
                window.scrollTo({ top: 0, behavior: "smooth" });
                setTimeout(() => setNotice(null), 8_000);
              }
            }}
          />
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
          {state.money && !editMoney && <LimitsForm state={state} onSave={save} />}
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
