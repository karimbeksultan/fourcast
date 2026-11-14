"use client";

// Welcome page, v2 (LIMIT_GUARD.md §9). Structure follows zimran.io: big hero with one action, marquee
// bands as transitions, a statement block, a grid of cards, "what it means for you", how it works,
// pricing, a closing call to action. Colors are our own (DESIGN.md v3).
import { CalendarDays, FileText, Moon, ShieldAlert, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cellsFromTimeline, ForecastGrid } from "@/components/forecast-grid";
import { guardTitle, RiskCard } from "@/components/guard";
import { BlurFade } from "@/components/ui/blur-fade";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useToday } from "@/hooks/use-today";
import { buildTimeline, debitRisks } from "@/lib/plan";
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

/** The real Guard on sample data (the same calculation as the app), counted from today. */
function Preview() {
  const today = useToday();
  if (!today) return <div className="aspect-[4/5] w-full rounded-lg bg-primary-foreground/10" aria-hidden />;
  const sample = getSampleState(today);
  const state = { ...sample, plans: [...sample.plans, getSampleKlarnaPlan(today)] };
  const risks = debitRisks(state, today);
  const t = buildTimeline(state, today);
  return (
    <figure className="space-y-3 rounded-lg bg-card p-4 text-foreground shadow-[0_24px_60px_-30px_rgb(0_0_0/0.5)] sm:p-5 lg:rotate-2">
      <p className="flex items-center gap-2 text-3xl font-bold tracking-tight">
        <ShieldAlert className="size-7 text-short" aria-hidden />
        {guardTitle(risks)}
      </p>
      {risks[0] && (
        <ul>
          <RiskCard risk={risks[0]} today={today} />
        </ul>
      )}
      <ForecastGrid cells={cellsFromTimeline(t, risks).slice(0, 21)} today={today} />
      <figcaption className="text-xs text-muted-foreground">Sample data, counted live from today.</figcaption>
    </figure>
  );
}

const FEATURES = [
  {
    icon: ShieldAlert,
    title: "See What Won't Make It",
    body: "Every payment is checked against what's in checking that morning, before your paycheck lands.",
    cls: "bg-foreground text-background",
  },
  {
    icon: Moon,
    title: "Fix It The Night Before",
    body: "Move $25 tonight, or pay it by hand after payday. Your calendar reminds you at 8 pm.",
    cls: "bg-card text-foreground",
  },
  {
    icon: FileText,
    title: "Returned It? Dispute It.",
    body: "Mark a return and get a ready letter for the lender, plus the CFPB link if they don't answer.",
    cls: "bg-primary text-primary-foreground",
  },
  {
    icon: CalendarDays,
    title: "See 6 Weeks Ahead",
    body: "Paychecks, rent and every Klarna, Afterpay and Affirm payment on one calendar.",
    cls: "bg-payday text-on-payday",
  },
  {
    icon: ShoppingBag,
    title: "Buy The Morning After Payday",
    body: "Check a new plan before you buy. Payday Sync picks the day so every payment lands after your paycheck.",
    cls: "bg-card text-foreground",
  },
];

export function Landing({ hasData, onSample, onStart }: { hasData: boolean; onSample: () => void; onStart: () => void }) {
  return (
    <div className="full-bleed -mt-6 -mb-8 sm:-mt-10 sm:-mb-12">
      {/* 1. Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:pb-24">
          <BlurFade delay={0.05} inView>
            <h1 className="text-[clamp(2.5rem,6.4vw,5.75rem)] leading-[1.03] font-bold tracking-tight text-balance">
              Never Lose Your Limit To A Payment That&apos;s{" "}
              <span className="rounded-md bg-payday box-decoration-clone px-3 text-on-payday">5 Hours Late</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/85 sm:text-xl">
              Autopay runs in the morning. Your paycheck lands in the afternoon. Fourcast finds the Klarna, Afterpay and Affirm
              payments that won&apos;t make it and tells you what to do the night before.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {hasData ? (
                <Link href="/plans" className={cn(btn, "bg-background text-foreground hover:-translate-y-0.5")}>
                  Open My Guard
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
            <p className="mt-4 text-sm text-primary-foreground/75">No sign-up, no bank login. Your data stays in this browser.</p>
          </BlurFade>
          <BlurFade delay={0.25} inView className="mx-auto w-full max-w-md lg:max-w-none">
            <Preview />
          </BlurFade>
        </div>
      </section>

      {/* 2. Transition band */}
      <Band text="Debit at 6 am. Paycheck at 3 pm. Limit cut by 5 pm." />

      {/* 3. Statement */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-lg font-semibold text-primary">The problem</p>
          <blockquote className="mt-3 text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.08] font-bold tracking-tight">
            &ldquo;Missed a $7 payment by 5 hours&hellip; spending power went from{" "}
            <span className="rounded-md bg-foreground box-decoration-clone px-2 text-background">1000 to 200</span>.&rdquo;
          </blockquote>
          <p className="mt-4 text-muted-foreground">An Afterpay user, App Store review, 2026. Klarna shows Klarna. Afterpay shows Afterpay. Nobody warns you first.</p>
        </div>
        <dl className="grid content-end gap-6">
          <div className="border-t-2 border-foreground pt-3">
            <dt className="text-5xl font-bold tracking-tight">1 in 10</dt>
            <dd className="mt-1 text-base">
              one- and two-star reviews of Klarna, Afterpay, Affirm and Zip is about a failed payment, a cut limit or a refund that
              never landed. <span className="text-sm text-muted-foreground">617 App Store reviews, Nov 2026, keyword count</span>
            </dd>
          </div>
          <div className="border-t-2 border-foreground pt-3">
            <dt className="text-5xl font-bold tracking-tight">
              <NumberTicker value={47} className="tracking-tight text-current" />%
            </dt>
            <dd className="mt-1 text-base">
              of pay-later users paid late at least once in the past year.{" "}
              <a className="text-sm text-muted-foreground underline underline-offset-4" href="https://www.lendingtree.com/personal/buy-now-pay-later-loan-statistics/" target="_blank" rel="noreferrer">
                LendingTree, 2026
              </a>
            </dd>
          </div>
          <div className="border-t-2 border-foreground pt-3">
            <dt className="text-5xl font-bold tracking-tight">
              <NumberTicker value={17.6} decimalPlaces={1} className="tracking-tight text-current" />M
            </dt>
            <dd className="mt-1 text-base">
              Americans with pay-later plans at more than one lender. <span className="text-sm text-muted-foreground">CFPB, 2022 data</span>
            </dd>
          </div>
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
        <article className="rounded-lg border bg-card p-6">
          <p className="text-6xl font-bold tracking-tight text-primary">$1,000</p>
          <h3 className="mt-3 text-2xl font-bold">The limit you keep</h3>
          <p className="mt-2 text-muted-foreground">In the review above, one $7 payment five hours late cut it to $200. A $25 transfer the night before keeps it.</p>
        </article>
        <article className="rounded-lg border bg-card p-6">
          <p className="text-6xl font-bold tracking-tight text-primary">
            $<NumberTicker value={26.77} decimalPlaces={2} className="tracking-tight text-current" />
          </p>
          <h3 className="mt-3 text-2xl font-bold">The overdraft you skip</h3>
          <p className="mt-2 text-muted-foreground">The average US overdraft fee. One of them costs about as much as a year of Plus.</p>
          <a className="mt-3 inline-block text-sm underline underline-offset-4" href="https://www.bankrate.com/banking/checking/checking-account-survey/" target="_blank" rel="noreferrer">
            Bankrate, 2025
          </a>
        </article>
        <article className="rounded-lg border bg-card p-6">
          <p className="text-6xl font-bold tracking-tight text-primary">0</p>
          <h3 className="mt-3 text-2xl font-bold">Bank logins needed</h3>
          <p className="mt-2 text-muted-foreground">No account, no bank link, no email. Your numbers never leave this browser.</p>
        </article>
      </section>

      {/* 7. How it works */}
      <section id="how" className="scroll-mt-20 bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight">How It Works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Add your plans", "Paste, screenshot or type each Klarna, Afterpay or Affirm plan."],
              ["Add your money", "Balance, paycheck, rent and everyday spending. Seven fields, one minute."],
              ["Fix it the night before", "Guard shows the payments that won't make it and what to do about each one."],
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
            Not financial advice. Fourcast only counts your own numbers; you decide.
          </p>
        </div>
      </section>

      {/* 8. Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="price">
        <h2 id="price" className="max-w-4xl text-[clamp(2.25rem,5vw,4rem)] leading-[1.05] font-bold tracking-tight">
          See The Risk Free. <span className="rounded-md bg-primary box-decoration-clone px-3 text-primary-foreground">$29.99 A Year</span> To
          Never Watch It Yourself.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-2xl font-bold">Free</p>
            <p className="mt-1 text-muted-foreground">All your plans, Guard, return disputes, the 6-week forecast and a yes or not-yet before you buy.</p>
          </div>
          <div className="rounded-lg border-2 border-primary bg-card p-6">
            <p className="text-2xl font-bold">Plus, $29.99 a year</p>
            <p className="mt-1 text-muted-foreground">
              A reminder at 8 pm before every risky payment, Payday Sync, and the exact day a new buy would run you short. Free for
              your next 2 paydays.
            </p>
          </div>
        </div>
        <Link href="/pricing" className="mt-6 inline-block text-lg font-semibold text-primary underline underline-offset-4">
          Compare Free and Plus
        </Link>
      </section>

      <Band text="Klarna   Afterpay   Affirm   Zip   PayPal Pay in 4   One Guard for all of them" />

      {/* 9. Closing call to action */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <h2 className="max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] font-bold tracking-tight">Ready To Keep Your Limits?</h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {hasData ? (
            <Link href="/plans" className={cn(btn, "bg-primary text-primary-foreground hover:-translate-y-0.5")}>
              Open My Guard
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
