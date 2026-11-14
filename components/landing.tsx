"use client";

// Welcome page. Structure follows zimran.io: big hero with one action, marquee bands as transitions
// ("But before you join, here's what…"), a statement block, a grid of cards, "what it means for you",
// a block with the next step, a closing call to action. Colors are our own (DESIGN.md v3).
import { Bell, CalendarDays, ClipboardPaste, Repeat, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { STATUS_TITLE } from "@/components/copy";
import { cellsFromTimeline, ForecastGrid } from "@/components/forecast-grid";
import { LowestLine } from "@/components/money";
import { BlurFade } from "@/components/ui/blur-fade";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useToday } from "@/hooks/use-today";
import { buildTimeline } from "@/lib/plan";
import { getSampleKlarnaPlan, getSampleState } from "@/lib/sample";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-14 items-center justify-center rounded-md px-7 text-lg font-bold outline-none transition-transform focus-visible:ring-4 focus-visible:ring-ring/50 active:translate-y-px";

function Band({ text, tone = "ink" }: { text: string; tone?: "ink" | "sky" }) {
  return (
    <div className={cn("py-4", tone === "ink" ? "bg-foreground text-background" : "bg-payday text-on-payday")} aria-hidden>
      <Marquee pauseOnHover className="[--duration:32s] [--gap:2.5rem]">
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center gap-10 text-2xl font-bold whitespace-nowrap sm:text-3xl">
            {text}
            <span className={cn("flex size-9 items-center justify-center rounded-md text-lg", tone === "ink" ? "bg-primary" : "bg-foreground")}>
              4
            </span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}

function Preview() {
  const today = useToday();
  if (!today) return <div className="aspect-[4/5] w-full rounded-lg bg-primary-foreground/10" aria-hidden />;
  const sample = getSampleState(today);
  const t = buildTimeline({ ...sample, plans: [...sample.plans, getSampleKlarnaPlan(today)] }, today);
  return (
    <figure className="rounded-lg bg-card p-4 text-foreground shadow-[0_24px_60px_-30px_rgb(0_0_0/0.5)] sm:p-5 lg:rotate-2">
      <p className="text-3xl font-bold tracking-tight">{STATUS_TITLE[t.status]}</p>
      <LowestLine timeline={t} className="mb-4 text-sm text-muted-foreground" />
      <ForecastGrid cells={cellsFromTimeline(t)} today={today} ring={t.lowest.date} />
      <figcaption className="mt-3 text-xs text-muted-foreground">Sample data, counted live from today.</figcaption>
    </figure>
  );
}

const FEATURES = [
  { icon: ClipboardPaste, title: "Add Every Plan", body: "Paste the confirmation, drop a screenshot or type it in. AI reads it in about two seconds.", cls: "bg-foreground text-background" },
  { icon: CalendarDays, title: "See 6 Weeks Ahead", body: "Paychecks, rent, everyday spending and every payment on one calendar. Your lowest day shows up before it happens.", cls: "bg-card text-foreground" },
  { icon: ShoppingBag, title: "Check Before You Buy", body: "Type a price. Get a yes or a not-yet, counted from your real balance and paydays.", cls: "bg-primary text-primary-foreground" },
  { icon: Repeat, title: "Buy On Payday", body: "Payday Sync finds the day to buy so all 4 payments land on paydays.", cls: "bg-payday text-on-payday" },
  { icon: Bell, title: "A Nudge The Night Before", body: "Your calendar reminds you at 8 pm. One tap, type your balance, see if tomorrow is covered.", cls: "bg-card text-foreground" },
];

export function Landing({ hasData, onSample, onStart }: { hasData: boolean; onSample: () => void; onStart: () => void }) {
  return (
    <div className="full-bleed -mt-6 -mb-8 sm:-mt-10 sm:-mb-12">
      {/* 1. Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:pb-24">
          <BlurFade delay={0.05} inView>
            <h1 className="text-[clamp(2.75rem,7vw,6.25rem)] leading-[1.02] font-bold tracking-tight text-balance">
              See Every Pay In&nbsp;4 <span className="rounded-md bg-payday box-decoration-clone px-3 text-on-payday">Before It Lands</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85 sm:text-xl">
              Klarna, Afterpay and Affirm on one 6-week forecast, counted from your paycheck. Check any new plan before you buy it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {hasData ? (
                <Link href="/plans" className={cn(btn, "bg-background text-foreground hover:-translate-y-0.5")}>
                  Open My Forecast
                </Link>
              ) : (
                <>
                  <button type="button" onClick={onSample} className={cn(btn, "bg-background text-foreground hover:-translate-y-0.5")}>
                    Try It With Sample Data
                  </button>
                  <button
                    type="button"
                    onClick={onStart}
                    className={cn(btn, "border-2 border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground/10")}
                  >
                    Start With My Numbers
                  </button>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-primary-foreground/75">No sign-up. Your data stays in this browser.</p>
          </BlurFade>
          <BlurFade delay={0.25} inView className="mx-auto w-full max-w-md lg:max-w-none">
            <Preview />
          </BlurFade>
        </div>
      </section>

      {/* 2. Transition band */}
      <Band text="Before you buy again, here's what's already coming" />

      {/* 3. Statement */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-lg font-semibold text-primary">The problem</p>
          <h2 className="mt-3 text-[clamp(2rem,4.6vw,3.75rem)] leading-[1.08] font-bold tracking-tight">
            Klarna shows Klarna. Afterpay shows Afterpay. Nobody shows you{" "}
            <span className="rounded-md bg-foreground box-decoration-clone px-2 text-background">all of it</span> until your account
            hits $0.
          </h2>
        </div>
        <dl className="grid content-end gap-6">
          {[
            { n: 21.2, d: 1, suffix: "%", text: "of Americans with a credit record used pay-later loans", src: "CFPB, 2022 data" },
            { n: 63, d: 0, suffix: "%", text: "of them had several loans open at once", src: "CFPB, 2022 data" },
            { n: 9.5, d: 1, suffix: "", text: "new pay-later loans per borrower in a year", src: "CFPB, 2022 data" },
          ].map((s) => (
            <div key={s.text} className="border-t-2 border-foreground pt-3">
              <dt className="text-5xl font-bold tracking-tight">
                <NumberTicker value={s.n} decimalPlaces={s.d} className="tracking-tight text-current" />
                {s.suffix}
              </dt>
              <dd className="mt-1 text-base">
                {s.text}. <span className="text-sm text-muted-foreground">{s.src}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 4. What it does: card grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24" aria-labelledby="does">
        <h2 id="does" className="text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight">
          What Fourcast Does
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-6">
          {FEATURES.map((f, i) => (
            <li
              key={f.title}
              className={cn(
                "relative flex min-h-64 flex-col overflow-hidden rounded-lg border p-6",
                f.cls,
                i < 3 ? "md:col-span-2" : "md:col-span-3",
              )}
            >
              <h3 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{f.title}</h3>
              <p className="relative z-10 mt-3 max-w-sm text-base opacity-90">{f.body}</p>
              <f.icon className="absolute -right-5 -bottom-5 size-36 opacity-15" strokeWidth={2.25} aria-hidden />
            </li>
          ))}
        </ul>
      </section>

      {/* 5. Transition band */}
      <Band text="And here's what it means for your money" tone="sky" />

      {/* 6. What it means for you */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:py-24 md:grid-cols-3">
        {[
          {
            big: (
              <>
                $<NumberTicker value={26.77} decimalPlaces={2} className="tracking-tight text-current" />
              </>
            ),
            title: "The overdraft you skip",
            body: "The average US overdraft fee. One of them costs about as much as a year of Plus.",
            src: "Bankrate, 2025",
            href: "https://www.bankrate.com/banking/checking/checking-account-survey/",
          },
          {
            big: (
              <>
                <NumberTicker value={47} className="tracking-tight text-current" />%
              </>
            ),
            title: "Of pay-later users paid late",
            body: "At least once in the past year. Fourcast shows the short day weeks before it comes.",
            src: "LendingTree, 2026",
            href: "https://www.lendingtree.com/personal/buy-now-pay-later-loan-statistics/",
          },
          {
            big: <>0</>,
            title: "Bank logins needed",
            body: "No account, no bank link, no email. Your numbers never leave this browser.",
            src: null,
            href: null,
          },
        ].map((b) => (
          <article key={b.title} className="rounded-lg border bg-card p-6">
            <p className="text-6xl font-bold tracking-tight text-primary">{b.big}</p>
            <h3 className="mt-3 text-2xl font-bold">{b.title}</h3>
            <p className="mt-2 text-muted-foreground">{b.body}</p>
            {b.href && (
              <a className="mt-3 inline-block text-sm underline underline-offset-4" href={b.href} target="_blank" rel="noreferrer">
                {b.src}
              </a>
            )}
          </article>
        ))}
      </section>

      {/* 7. How it works */}
      <section id="how" className="scroll-mt-20 bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight">How It Works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Add your plans", "Paste, screenshot or type each Klarna, Afterpay or Affirm plan."],
              ["Add your money", "Balance, paycheck, rent and everyday spending. Seven fields, one minute."],
              ["See and check", "Your 6-week forecast, and a yes or not-yet for anything you want to buy."],
            ].map(([title, body], i) => (
              <li key={title} className="border-t-2 border-background/40 pt-4">
                <span className="text-sm text-background/70">Step {i + 1}</span>
                <h3 className="mt-1 text-3xl font-bold">{title}</h3>
                <p className="mt-2 text-background/80">{body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 flex items-center gap-2 text-background/80">
            <ShieldCheck className="size-5" aria-hidden />
            Not financial advice. Fourcast only counts; you decide.
          </p>
        </div>
      </section>

      {/* 8. Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="price">
        <h2 id="price" className="max-w-4xl text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight">
          Free To See. <span className="rounded-md bg-primary box-decoration-clone px-3 text-primary-foreground">$29.99 A Year</span> For
          The Answer.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-2xl font-bold">Free</p>
            <p className="mt-1 text-muted-foreground">All your plans, the 6-week forecast and a yes or not-yet before you buy.</p>
          </div>
          <div className="rounded-lg border-2 border-primary bg-card p-6">
            <p className="text-2xl font-bold">Plus, $29.99 a year</p>
            <p className="mt-1 text-muted-foreground">
              The exact day you&apos;d run short, the first day a buy fits, Payday Sync and reminders the night before. Free for your
              next 2 paydays.
            </p>
          </div>
        </div>
        <Link href="/pricing" className="mt-6 inline-block text-lg font-semibold text-primary underline underline-offset-4">
          Compare Free and Plus
        </Link>
      </section>

      <Band text="Klarna   Afterpay   Affirm   Zip   PayPal Pay in 4   All on one forecast" />

      {/* 9. Closing call to action */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <h2 className="max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] font-bold tracking-tight">
          Ready To See Your Next 6 Weeks?
        </h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {hasData ? (
            <Link href="/plans" className={cn(btn, "bg-primary text-primary-foreground hover:-translate-y-0.5")}>
              Open My Forecast
            </Link>
          ) : (
            <button type="button" onClick={onSample} className={cn(btn, "bg-primary text-primary-foreground hover:-translate-y-0.5")}>
              Try It With Sample Data
            </button>
          )}
          <Link href="/faq" className={cn(btn, "border-2 border-foreground text-foreground hover:bg-foreground/5")}>
            Read The FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
