"use client";

// First screen for a new visitor (and the jury). Visual language from zimran.io:
// flat violet blocks, huge type with one phrase in a black box, a black marquee, black buttons.
import { CalendarDays, ClipboardPaste, Repeat } from "lucide-react";
import { lowestLine, STATUS_TITLE } from "@/components/copy";
import { cellsFromTimeline, ForecastGrid } from "@/components/forecast-grid";
import { BlurFade } from "@/components/ui/blur-fade";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useToday } from "@/hooks/use-today";
import { buildTimeline } from "@/lib/plan";
import { getSampleKlarnaPlan, getSampleState } from "@/lib/sample";
import { cn } from "@/lib/utils";

const LENDERS = ["Klarna", "Afterpay", "Affirm", "Zip", "PayPal Pay in 4", "One forecast for all of them"];

const btn =
  "inline-flex h-14 items-center justify-center rounded-md px-7 text-lg font-bold outline-none transition-transform focus-visible:ring-4 focus-visible:ring-on-payday/60 active:translate-y-px";

function Preview() {
  const today = useToday();
  if (!today) return <div className="aspect-[4/5] w-full rounded-md bg-on-payday/10" aria-hidden />;
  const sample = getSampleState(today);
  const t = buildTimeline({ ...sample, plans: [...sample.plans, getSampleKlarnaPlan(today)] }, today);
  return (
    <div className="rounded-md bg-card p-4 text-foreground sm:p-5 lg:-rotate-2" aria-label="Example forecast with sample data">
      <p className="text-3xl font-bold tracking-tight">{STATUS_TITLE[t.status]}</p>
      <p className="tabular mb-4 text-sm text-muted-foreground">{lowestLine(t)}</p>
      <ForecastGrid cells={cellsFromTimeline(t)} today={today} ring={t.lowest.date} />
    </div>
  );
}

export function Landing({ onSample, onStart }: { onSample: () => void; onStart: () => void }) {
  return (
    <div className="full-bleed -mt-6 -mb-8 sm:-mt-10 sm:-mb-12">
      <section className="bg-payday text-on-payday">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:pb-24">
          <BlurFade delay={0.05} inView>
            <h1 className="text-[clamp(2.75rem,7.2vw,6.5rem)] leading-[1.02] font-bold tracking-tight text-balance">
              See Every Pay In 4{" "}
              <span className="rounded-md bg-foreground box-decoration-clone px-3 text-on-payday">Before It Lands</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-on-payday/85 sm:text-xl">
              Klarna, Afterpay and Affirm on one 6-week forecast, counted from your paycheck. Check any new plan before you
              buy it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={onSample} className={cn(btn, "bg-foreground text-on-payday hover:-translate-y-0.5")}>
                Try It With Sample Data
              </button>
              <button
                type="button"
                onClick={onStart}
                className={cn(btn, "border-2 border-on-payday/80 text-on-payday hover:bg-on-payday hover:text-payday")}
              >
                Start With My Numbers
              </button>
            </div>
            <p className="mt-4 text-sm text-on-payday/75">No sign-up. Your data stays in this browser.</p>
          </BlurFade>
          <BlurFade delay={0.25} inView className="mx-auto w-full max-w-md lg:max-w-none">
            <Preview />
          </BlurFade>
        </div>
      </section>

      <div className="bg-foreground py-4 text-on-payday" aria-label="Works with Klarna, Afterpay, Affirm, Zip and PayPal Pay in 4">
        <Marquee pauseOnHover className="[--duration:28s] [--gap:2.5rem]" aria-hidden>
          {LENDERS.map((name) => (
            <span key={name} className="flex items-center gap-10 text-2xl font-bold whitespace-nowrap sm:text-3xl">
              {name}
              <span className="flex size-9 items-center justify-center rounded-full bg-payday text-lg">4</span>
            </span>
          ))}
        </Marquee>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <h2 className="max-w-3xl text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight">
          Three Steps. One Clear Answer.
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ClipboardPaste,
              title: "Add Every Plan",
              body: "Paste the confirmation, drop a screenshot or type it in. AI reads it in about two seconds.",
              cls: "bg-foreground text-on-payday",
              titleCls: "text-on-payday",
            },
            {
              icon: CalendarDays,
              title: "See 6 Weeks Ahead",
              body: "Paychecks, rent and every payment on one calendar. You see your lowest day before it happens.",
              cls: "bg-card text-foreground",
              titleCls: "text-payday",
            },
            {
              icon: Repeat,
              title: "Buy On Payday",
              body: "Payday Sync finds the day to buy so all 4 payments land on paydays.",
              cls: "bg-payday text-on-payday",
              titleCls: "text-on-payday",
            },
          ].map((card, i) => (
            <li key={card.title} className={cn("relative flex min-h-72 flex-col overflow-hidden rounded-md p-6", card.cls)}>
              <span className="text-sm font-medium opacity-70">Step {i + 1}</span>
              <h3 className={cn("mt-2 text-4xl leading-tight font-bold tracking-tight", card.titleCls)}>{card.title}</h3>
              <p className="relative z-10 mt-3 max-w-xs text-base opacity-90">{card.body}</p>
              <card.icon className="absolute -right-6 -bottom-6 size-40 opacity-15" strokeWidth={2.5} aria-hidden />
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-payday text-on-payday">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 md:grid-cols-2">
          <div>
            <p className="text-[clamp(4rem,10vw,8rem)] leading-none font-bold tracking-tight">
              <NumberTicker value={47} className="tracking-tight text-current" />%
            </p>
            <p className="mt-3 max-w-sm text-xl">of pay-later users paid late at least once in the past year.</p>
            <a
              className="mt-2 inline-block text-sm text-on-payday/70 underline underline-offset-4"
              href="https://www.lendingtree.com/personal/buy-now-pay-later-loan-statistics/"
              target="_blank"
              rel="noreferrer"
            >
              LendingTree, 2026
            </a>
          </div>
          <div>
            <p className="text-[clamp(4rem,10vw,8rem)] leading-none font-bold tracking-tight">
              $<NumberTicker value={26.77} decimalPlaces={2} className="tracking-tight text-current" />
            </p>
            <p className="mt-3 max-w-sm text-xl">is the average overdraft fee when a payment hits an empty account.</p>
            <a
              className="mt-2 inline-block text-sm text-on-payday/70 underline underline-offset-4"
              href="https://www.bankrate.com/banking/checking/checking-account-survey/"
              target="_blank"
              rel="noreferrer"
            >
              Bankrate, 2025
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <h2 className="max-w-4xl text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight">
          Free To See.{" "}
          <span className="rounded-md bg-foreground box-decoration-clone px-3 text-on-payday">$29.99 A Year</span> For The Answer.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          All your plans and the 6-week forecast are free. Plus tells you the exact day a new buy fits, finds your Payday Sync day
          and reminds you the night before each payment. Free for your next 2 paydays.
        </p>
        <button type="button" onClick={onSample} className={cn(btn, "mt-8 bg-foreground text-on-payday hover:-translate-y-0.5")}>
          Try It With Sample Data
        </button>
      </section>
    </div>
  );
}
