"use client";

// "Tonight" (CONCEPT.md): one screen that answers, in order, "do I need to do anything tonight?",
// "what do my next mornings look like?", "where is my refund?" and "what do I owe?".
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadIcs } from "@/components/ics-download";
import { useState } from "react";
import { MorningStrip } from "@/components/concept/morning-strip";
import { OwedSummary, QuickCheck } from "@/components/concept/owed-and-check";
import { ReturnsTracker } from "@/components/concept/returns-tracker";
import { TonightHero } from "@/components/concept/tonight-hero";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-today";
import {
  ackKey,
  getConceptSample,
  loadAcks,
  saveAcks,
  nextRisk,
  owedByLender,
  returnViews,
  type RefundStage,
} from "@/lib/concept";
import { buildTimeline, debitRisks } from "@/lib/plan";
import type { AppState, ISODate, Plan } from "@/lib/types";

export default function TonightPage() {
  const [state, save] = useAppState();
  const today = useToday();

  if (state === undefined || !today) return <TonightSkeleton />;
  if (state === null)
    return (
      <Start
        onSample={() => save(getConceptSample(today))}
      />
    );
  if (!state.money) return <NeedsMoney />;
  return <Tonight state={state} today={today} save={save} />;
}

function Tonight({ state, today, save }: { state: AppState; today: ISODate; save: (s: AppState) => void }) {
  const router = useRouter();
  // Rendered only in the browser (state is undefined on the server), so localStorage is safe here.
  // The last return marked credited, kept so "Undo" can put the plan back.
  const [closed, setClosed] = useState<{ plan: Plan; text: string } | null>(null);
  const [acks, setAcks] = useState<Record<string, true>>(loadAcks);

  const timeline = buildTimeline(state, today);
  const risk = nextRisk(state, today);
  const openRisks = debitRisks(state, today).filter((r) => !r.disputed).length;
  const views = returnViews(state, today);

  const setStage = (planId: string, stage: RefundStage) => {
    if (stage !== "credited") {
      save({
        ...state,
        plans: state.plans.map((p) => {
          if (p.id !== planId) return p;
          if (stage === "store_refunded") return { ...p, refundStage: "store_refunded" as const };
          const rest = { ...p };
          delete rest.refundStage;
          return rest;
        }),
      });
      return;
    }
    // Credited: the lender cancelled what was left, so the plan leaves the forecast (the schema needs 1+ payments left).
    if (stage === "credited") {
      const plan = state.plans.find((p) => p.id === planId);
      if (plan) setClosed({ plan, text: `${plan.merchant} is closed: ${plan.lender} credited your return.` });
      save({ ...state, plans: state.plans.filter((p) => p.id !== planId) });
    }
  };

  const markReturned = (planId: string) =>
    save({ ...state, plans: state.plans.map((p) => (p.id === planId ? { ...p, status: "returned", returnedOn: today } : p)) });

  return (
    <div className="space-y-8">
      <TonightHero
        risk={risk}
        more={Math.max(0, openRisks - 1)}
        timeline={timeline}
        today={today}
        plus={Boolean(state.plus)}
        onRemind={() => (state.plus ? downloadIcs(state, today) : router.push("/plans#plus"))}
        done={risk ? Boolean(acks[ackKey(risk.planId, risk.date)]) : false}
        onDone={(done) => {
          if (!risk) return;
          const next = { ...acks };
          if (done) next[ackKey(risk.planId, risk.date)] = true;
          else delete next[ackKey(risk.planId, risk.date)];
          setAcks(next);
          saveAcks(next);
        }}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          <MorningStrip timeline={timeline} focus={risk?.date} />
          <div className="space-y-3">
            {closed && (
              <p className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-ok-soft p-3 text-sm font-medium" role="status">
                {closed.text}
                <button
                  type="button"
                  onClick={() => {
                    save({ ...state, plans: [...state.plans, closed.plan] });
                    setClosed(null);
                  }}
                  className="font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  Undo
                </button>
              </p>
            )}
            <ReturnsTracker views={views} onStage={setStage} />
          </div>
        </div>
        <aside className="space-y-6">
          <OwedSummary rows={owedByLender(state, today)} plans={state.plans} today={today} onReturned={markReturned} />
          <QuickCheck state={state} today={today} />
          <Link
            href="/plans"
            className="block text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Add a plan or change my money
          </Link>
        </aside>
      </div>
    </div>
  );
}

function TonightSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tonight">
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function Start({ onSample }: { onSample: () => void }) {
  return (
    <section className="max-w-2xl space-y-5 py-6 sm:py-12">
      <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">One question every evening: will tomorrow&apos;s payments clear?</h1>
      <p className="text-lg text-muted-foreground">
        Fourcast checks every Klarna, Afterpay, Affirm and Zip payment against the morning it&apos;s taken, before your paycheck lands,
        and follows your refunds until the lender credits them.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSample}
          className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Try it with sample data
        </button>
        <Link
          href="/plans"
          className="inline-flex h-12 items-center rounded-md border px-6 text-base font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Start with my numbers
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">No sign-up. Your plans are saved only in this browser.</p>
    </section>
  );
}

function NeedsMoney() {
  return (
    <section className="max-w-2xl space-y-4 py-6">
      <h1 className="text-3xl font-bold tracking-tight">Add your paycheck first</h1>
      <p className="text-muted-foreground">Tonight needs your balance and payday to tell which mornings are short.</p>
      <Link
        href="/plans"
        className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Add my money
      </Link>
    </section>
  );
}
