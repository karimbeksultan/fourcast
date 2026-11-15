"use client";

import { ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddPlan } from "@/components/add-plan";
import { guardTitle } from "@/components/guard";
import { CheckIn } from "@/components/check-in";
import { FREQUENCY_LABEL } from "@/components/copy";
import { LimitsForm } from "@/components/limits-form";
import { MoneyForm } from "@/components/money-form";
import { PlusOffer } from "@/components/plus-offer";
import { PaymentsList } from "@/components/payments-list";
import { PlanCard } from "@/components/plan-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useQueryParam } from "@/hooks/use-query-param";
import { useToday } from "@/hooks/use-today";
import { formatShort, formatUSD } from "@/lib/dates";
import { buildTimeline, debitRisks } from "@/lib/plan";
import { getSampleState } from "@/lib/sample";
import { clearState, emptyState } from "@/lib/storage";
import type { AppState, ISODate } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PlansPage() {
  const [state, save] = useAppState();
  const today = useToday();

  if (state === undefined || !today) return <HomeSkeleton />;
  if (state === null)
    return (
      <Welcome
        onSample={() => save(getSampleState(today))}
        onStart={() => save(emptyState())}
      />
    );
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

function Welcome({
  onSample,
  onStart,
}: {
  onSample: () => void;
  onStart: () => void;
}) {
  return (
    <section className="max-w-2xl space-y-5 py-6 sm:py-12">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Your plans live here
      </h1>
      <p className="text-lg text-muted-foreground">
        Try Fourcast on sample data first, or add your own Klarna, Afterpay and
        Affirm plans. It takes about a minute.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button className="h-12 px-6 text-base" onClick={onSample}>
          Try it with sample data
        </Button>
        <Button
          variant="outline"
          className="h-12 px-6 text-base"
          onClick={onStart}
        >
          Start with my numbers
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        No sign-up. Your plans are saved only in this browser.
      </p>
    </section>
  );
}

function Overview({
  state,
  today,
  save,
}: {
  state: AppState;
  today: ISODate;
  save: (s: AppState) => boolean;
}) {
  const due = useQueryParam("due");
  const [checkInOpen, setCheckInOpen] = useState(true);
  const [editMoney, setEditMoney] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timeline = state.money ? buildTimeline(state, today) : null;
  const returns: Record<string, ISODate> = Object.fromEntries(
    state.plans
      .filter((p) => p.status === "returned" && p.returnedOn)
      .map((p) => [p.id, p.returnedOn as ISODate]),
  );
  const risks = state.money
    ? debitRisks(state, today).filter((r) => !r.disputed)
    : [];
  const setReturned = (id: string, on: ISODate | null) =>
    save({
      ...state,
      plans: state.plans.map((x) => {
        if (x.id !== id) return x;
        if (on) return { ...x, status: "returned" as const, returnedOn: on };
        const rest = { ...x };
        delete rest.returnedOn;
        delete rest.refundStage;
        return { ...rest, status: "active" as const };
      }),
    });
  const showCheckIn =
    checkInOpen && due && /^\d{4}-\d{2}-\d{2}$/.test(due) && state.money;

  const first = risks[0];
  const statusTone = !timeline
    ? null
    : risks.some((r) => r.level === "fails")
      ? "short"
      : risks.length
        ? "tight"
        : "ok";

  return (
    <>
      {/* One job here: your plans and your money, the inputs. What to do about them lives on Tonight. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your plans
          </h1>
          {timeline && state.plans.length > 0 && (
            <p className="tabular mt-1 text-lg text-muted-foreground">
              {formatUSD(timeline.owed)} left to pay on {state.plans.length}{" "}
              {state.plans.length === 1 ? "plan" : "plans"}
            </p>
          )}
        </div>
        {!state.sample && (
          <Button variant="outline" size="sm" className="h-8" onClick={() => clearState()}>
            Start over
          </Button>
        )}
      </div>

      {notice && (
        <p
          className="rounded-md bg-foreground px-4 py-3 font-semibold text-background"
          role="status"
        >
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
        <Link
          href="/tonight"
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            statusTone === "short"
              ? "bg-short-soft"
              : statusTone === "tight"
                ? "bg-tight-soft"
                : "bg-ok-soft",
          )}
        >
          <span className="flex items-center gap-2 font-semibold">
            {statusTone === "ok" ? (
              <ShieldCheck className="size-5 shrink-0 text-ok" aria-hidden />
            ) : (
              <TriangleAlert
                className={cn(
                  "size-5 shrink-0",
                  statusTone === "short" ? "text-short" : "text-tight",
                )}
                aria-hidden
              />
            )}
            {first
              ? `${guardTitle(risks)} ${first.lender} on ${formatShort(first.date)}${risks.length > 1 ? " first" : ""}.`
              : "Every payment clears in the next 6 weeks."}
          </span>
          <span className="text-sm font-semibold text-primary">
            {first ? "See what to do tonight" : "Open Tonight"}
          </span>
        </Link>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {state.plans.length > 0 ? (
            <section aria-labelledby="plans" className="space-y-3">
              {/* The count and the total already sit under the page title. */}
              <h2 id="plans" className="sr-only">
                Plans
              </h2>
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
                    onMissed={(date, missed) =>
                      save({
                        ...state,
                        plans: state.plans.map((x) =>
                          x.id !== p.id
                            ? x
                            : { ...x, missed: missed ? [...new Set([...(x.missed ?? []), date])] : (x.missed ?? []).filter((d) => d !== date) },
                        ),
                      })
                    }
                    onRemove={() =>
                      save({
                        ...state,
                        plans: state.plans.filter((x) => x.id !== p.id),
                      })
                    }
                  />
                ))}
              </ul>
            </section>
          ) : (
            <p className="rounded-md border border-dashed p-4 text-muted-foreground">
              No plans yet. Add your first Klarna, Afterpay or Affirm plan
              below.
            </p>
          )}
          <div id="add" className="scroll-mt-28">
            <AddPlan
              today={today}
              sample={state.sample}
              onAdd={(plan) => {
                const next = { ...state, plans: [...state.plans, plan] };
                // Not saved (the schema refused it): no "plan added"; the form keeps what was typed and says why.
                if (!save(next)) return false;
                if (next.money) {
                  const n = debitRisks(next, today).filter(
                    (r) => !r.disputed,
                  ).length;
                  setNotice(
                    `${plan.lender} plan added. Tonight updated: ${n === 0 ? "every payment clears." : n === 1 ? "1 payment at risk." : `${n} payments at risk.`}`,
                  );
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setTimeout(() => setNotice(null), 8_000);
                }
                return true;
              }}
            />
          </div>
        </div>

        <section
          aria-labelledby="money"
          className="h-fit space-y-3 rounded-md border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="money" className="text-lg font-semibold">
              Your money
            </h2>
            {state.money && !editMoney && (
              <Button
                variant="outline"
                className="h-9"
                onClick={() => setEditMoney(true)}
              >
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
                {formatUSD(state.money.paycheck)},{" "}
                {FREQUENCY_LABEL[state.money.frequency].toLowerCase()}
              </dd>
              <dt className="text-muted-foreground">Next payday</dt>
              <dd>{formatShort(state.money.nextPayday)}</dd>
              <dt className="text-muted-foreground">Rent</dt>
              <dd>
                {state.money.rent > 0
                  ? `${formatUSD(state.money.rent)} on day ${state.money.rentDay}`
                  : "None"}
              </dd>
              <dt className="text-muted-foreground">Everyday</dt>
              <dd>{formatUSD(state.money.weeklySpend)} a week</dd>
            </dl>
          ) : (
            <>
              {!state.money && (
                <p className="text-sm text-muted-foreground">
                  Add your money to see the forecast.
                </p>
              )}
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
          {state.money && !editMoney && (
            <LimitsForm state={state} onSave={save} />
          )}
        </section>
      </div>

      <PaymentsList plans={state.plans} today={today} />

      {timeline && !state.plus && (
        <PlusOffer
          state={state}
          timeline={timeline}
          today={today}
          save={save}
        />
      )}
    </>
  );
}
