"use client";

// Welcome page, concept "Tonight" (CONCEPT.md). Plain, exact words (DESIGN.md) with motion that carries the story:
// the same Friday morning played without and with Fourcast, a moving statement band, and three live answer panels.
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AnswerPanels, Band, RevealHeadline } from "@/components/concept/landing-motion";
import { MorningStory } from "@/components/concept/morning-story";
import { useToday } from "@/hooks/use-today";
import { getConceptSample, nextRisk } from "@/lib/concept";
import { buildTimeline } from "@/lib/plan";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-14 items-center justify-center rounded-md px-7 text-lg font-bold outline-none transition-transform focus-visible:ring-4 focus-visible:ring-ring/50 active:translate-y-px";

/** The focal moment: the sample's riskiest morning, played without and with Fourcast (same calculation as the app). */
function Preview() {
  const today = useToday();
  if (!today) return <div className="aspect-[4/5] w-full rounded-lg bg-primary-foreground/10" aria-hidden />;
  // The same sample "Try it with sample data" loads, so the story and the first app screen match.
  const state = getConceptSample(today);
  const risk = nextRisk(state, today);
  if (!risk || !state.money) return null;
  return (
    <figure className="space-y-2">
      <MorningStory risk={risk} paycheck={state.money.paycheck} />
      <figcaption className="text-sm text-primary-foreground">Sample data, counted live from today.</figcaption>
    </figure>
  );
}

/** The three answer panels, fed by the same sample. */
function Answers() {
  const today = useToday();
  if (!today) return <div className="h-80 rounded-lg bg-muted" aria-hidden />;
  const state = getConceptSample(today);
  return <AnswerPanels risk={nextRisk(state, today)} days={buildTimeline(state, today).days} />;
}

export function Landing({ hasData, onSample, onStart }: { hasData: boolean; onSample: () => void; onStart: () => void }) {
  return (
    <div className="full-bleed -mt-6 -mb-8 sm:-mt-10 sm:-mb-12">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:pb-24">
          {/* No entrance animation here: the headline, the buttons and the numbers are in the server HTML as they end up. */}
          <div>
            <RevealHeadline
              words={["Know", "tonight", "if", "tomorrow's", "payment"]}
              highlight="will clear"
              className="text-[clamp(2.5rem,5.4vw,4.75rem)] leading-[1.03] font-bold tracking-tight text-balance"
            />
            <p className="mt-6 max-w-xl text-lg text-pretty sm:text-xl">
              Autopay runs in the morning. Your paycheck lands in the afternoon. Fourcast finds the Klarna, Afterpay and Affirm
              payments that won&apos;t make it and tells you what to do the evening before.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {hasData ? (
                <Link href="/tonight" className={cn(btn, "bg-background text-foreground hover:-translate-y-0.5")}>
                  Open Tonight
                </Link>
              ) : (
                <>
                  <button type="button" onClick={onSample} className={cn(btn, "bg-background text-foreground hover:-translate-y-0.5")}>
                    Try it with sample data
                  </button>
                  <button
                    type="button"
                    onClick={onStart}
                    className={cn(btn, "border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10")}
                  >
                    Start with my numbers
                  </button>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-pretty text-primary-foreground">No sign-up, no bank login. Your plans are saved only in this browser.</p>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <Preview />
          </div>
        </div>
      </section>

      <Band text="Debit at 6 am. Paycheck at 3 pm. Limit cut by 5 pm." />

      {/* The problem, in a user's words, with independent numbers beside it */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
        <figure>
          <blockquote className="text-[clamp(1.875rem,3.8vw,3rem)] leading-[1.1] font-bold tracking-tight text-balance">
            &ldquo;Missed a $7 payment by 5 hours&hellip; spending power went from{" "}
            <span className="rounded-md bg-foreground box-decoration-clone px-2 text-background">1000 to 200</span>.&rdquo;
          </blockquote>
          <figcaption className="mt-4 max-w-xl text-pretty text-muted-foreground">
            An Afterpay user, App Store review, 2026. Klarna shows Klarna. Afterpay shows Afterpay. Nobody warns you first.
          </figcaption>
        </figure>
        <dl className="grid content-end gap-6">
          <div className="border-t-2 border-foreground pt-3">
            <dt className="tabular text-5xl font-bold tracking-tight">
              26%
            </dt>
            <dd className="mt-1 text-pretty">
              of US pay-later users paid late in the past year.{" "}
              <a
                className="text-sm text-muted-foreground underline underline-offset-4"
                href="https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-credit.htm"
                target="_blank"
                rel="noreferrer"
              >
                Federal Reserve, 2025 survey
              </a>
            </dd>
          </div>
          <div className="border-t-2 border-foreground pt-3">
            <dt className="tabular text-5xl font-bold tracking-tight">
              11%
            </dt>
            <dd className="mt-1 text-pretty">
              had a pay-later payment set off a bank overdraft or NSF fee.{" "}
              <span className="text-sm text-muted-foreground">Same survey</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* What it answers: three questions, one evening */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24" aria-labelledby="answers">
        <h2 id="answers" className="text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-bold tracking-tight text-balance">
          Three questions, answered every evening
        </h2>
        <div className="mt-10">
          <Answers />
        </div>
        <p className="mt-6 text-muted-foreground">
          Also there when you need it: a 6-week forecast, and a check before a new Pay in 4.
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-bold tracking-tight">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Add your plans", "Paste, screenshot or type each Klarna, Afterpay or Affirm plan."],
              ["Add your paycheck", "Balance, paycheck, rent and everyday spending. Seven fields, one minute."],
              ["Open Tonight each evening", "It tells you which payment won't make it and what to do before morning."],
            ].map(([title, body], i) => (
              <li key={title} className="border-t-2 border-background/40 pt-4">
                <h3 className="text-2xl font-bold sm:text-3xl">
                  <span className="tabular text-background/70">{i + 1}.</span> {title}
                </h3>
                <p className="mt-2 text-pretty text-background/85">{body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 flex items-center gap-2 text-background/85">
            <ShieldCheck className="size-5" aria-hidden />
            Not financial advice. Fourcast only counts your own numbers; you decide.
          </p>
        </div>
      </section>

      <Band text="Klarna, Afterpay, Affirm, Zip, PayPal Pay in 4. One evening check for all of them." tone="sky" />

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="price">
        <h2 id="price" className="max-w-4xl text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] font-bold tracking-tight text-balance">
          Seeing the risk is free. The evening reminder is{" "}
          <span className="rounded-md bg-primary box-decoration-clone px-2.5 text-primary-foreground">$29.99 a year</span>
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-2xl font-bold">Free</p>
            <p className="mt-1 text-pretty text-muted-foreground">
              Tonight, all your plans, returns and dispute letters, the 6-week forecast and a yes or not-yet before you buy.
            </p>
          </div>
          <div className="rounded-lg border-2 border-primary bg-card p-6">
            <p className="text-2xl font-bold">Plus, $29.99 a year</p>
            <p className="mt-1 text-pretty text-muted-foreground">
              A calendar reminder at 8 pm before every risky payment, Payday Sync, and how much short a new buy would run you. Free for
              your next 2 paydays.
            </p>
          </div>
        </div>
        <Link href="/pricing" className="mt-4 inline-flex min-h-11 items-center text-lg font-semibold text-primary underline underline-offset-4">
          Compare Free and Plus
        </Link>
      </section>

      {/* Closing call to action */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 className="max-w-4xl text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.05] font-bold tracking-tight text-balance">
            Keep your limits. Check tonight.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {hasData ? (
              <Link href="/tonight" className={cn(btn, "bg-primary text-primary-foreground hover:-translate-y-0.5")}>
                Open Tonight
              </Link>
            ) : (
              <button type="button" onClick={onSample} className={cn(btn, "bg-primary text-primary-foreground hover:-translate-y-0.5")}>
                Try it with sample data
              </button>
            )}
            <Link href="/faq" className={cn(btn, "border-2 border-foreground text-foreground hover:bg-foreground/5")}>
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
