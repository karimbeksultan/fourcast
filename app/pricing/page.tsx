import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing — Fourcast" };

const FREE = [
  "Unlimited Klarna, Afterpay, Affirm, Zip and PayPal plans",
  "Read plans from text or a screenshot",
  "Guard: the payments that may not go through, and what to do about each",
  "Mark a return and get a dispute letter",
  "Your 6-week forecast and a yes or not-yet before you buy",
];
const PLUS = [
  "Everything in Free",
  "A reminder at 8 pm the night before every risky payment, with a one-number check-in",
  "Payday Sync: the day to buy so every payment lands the morning after payday",
  "The exact day a new buy would run you short, and the first day it fits",
];

const link =
  "inline-flex h-12 items-center justify-center rounded-md px-6 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export default function PricingPage() {
  return (
    <>
      <header className="max-w-3xl space-y-3">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Pricing</h1>
        <p className="text-xl text-muted-foreground">Seeing the risk is free. Plus watches it for you and answers &quot;when can I buy it?&quot;.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col rounded-lg border bg-card p-6 sm:p-8" aria-labelledby="free">
          <h2 id="free" className="text-3xl font-bold">
            Free
          </h2>
          <p className="tabular mt-2 text-5xl font-bold">$0</p>
          <ul className="mt-6 space-y-3">
            {FREE.map((f) => (
              <li key={f} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/plans" className={cn(link, "mt-8 self-start border-2 border-foreground")}>
            Start free
          </Link>
        </section>

        <section className="flex flex-col rounded-lg border-2 border-primary bg-card p-6 sm:p-8" aria-labelledby="plus">
          <h2 id="plus" className="text-3xl font-bold">
            Plus
          </h2>
          <p className="tabular mt-2 text-5xl font-bold">
            $29.99<span className="text-xl font-medium text-muted-foreground"> a year</span>
          </p>
          <p className="text-muted-foreground">or $4.99 a month</p>
          <ul className="mt-6 space-y-3">
            {PLUS.map((f) => (
              <li key={f} className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-payday" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/check" className={cn(link, "mt-8 self-start bg-primary text-primary-foreground hover:bg-primary/90")}>
            Try Plus free
          </Link>
        </section>
      </div>

      <section className="max-w-3xl space-y-4 rounded-lg bg-muted p-6" aria-labelledby="terms">
        <h2 id="terms" className="text-2xl font-bold">
          How the trial works
        </h2>
        <p>Plus is free until your second payday from today. Cancel any time on the Check a buy page, and nothing is charged.</p>
        <p>Why a year: one cut limit or one average overdraft fee ($26.77, Bankrate 2025) costs about as much as a year of Plus.</p>
        <p className="text-sm text-muted-foreground">This is a hackathon demo: checkout runs in demo mode and no real payment is taken.</p>
      </section>
    </>
  );
}
